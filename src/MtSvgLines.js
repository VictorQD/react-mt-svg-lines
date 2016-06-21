import React, { PropTypes } from 'react';
import { findDOMNode } from 'react-dom';

import { shortUID, clamp, trimFloat, isMsBrowser, contains } from './utils.js';
import TWEEN from 'tween.js';

const EASING = {
  'ease':        TWEEN.Easing.Quadratic.InOut,
  'ease-in':     TWEEN.Easing.Cubic.In,
  'ease-out':    TWEEN.Easing.Cubic.Out,
  'ease-in-out': TWEEN.Easing.Cubic.InOut,
  'linear':      TWEEN.Easing.Linear.None,
  'step-start':  TWEEN.Easing.Bounce.In,   // not quite the same thing ;)
  'step-end':    TWEEN.Easing.Bounce.Out   // not quite the same thing ;)
};

const MS_PER_UPDATE = 1000 / 60;

export default class MtSvgLines extends React.Component {

  static propTypes = {
    className: PropTypes.string,            // custom CSS class (applied to svg elem)
    animate:   PropTypes.oneOfType([        // external animation trigger
      PropTypes.string,                     // - pass a unique string or true to (re)start animation
      PropTypes.number,                     // - pass a number to specify delay before the animation begins (ms)
      PropTypes.bool                        // - pass false (or omit) to draw static SVG (no animation)
    ]),
    duration:  PropTypes.number,            // total anim duration (ms)
    stagger:   PropTypes.number,            // delay between start times of each path (percentage)
    timing:    React.PropTypes.oneOf([      // easing type
      'ease',
      'ease-in',
      'ease-out',
      'ease-in-out',
      'linear',
      'step-start',
      'step-end'
    ]),
    playback:  PropTypes.string,            // iteration-count || direction || fill-mode (perhaps even play-state)
    fade:      PropTypes.bool,              // apply a fade-in to each path
    callback:  PropTypes.func,              // callback fn to run when when anim completes
    jsOnly:    PropTypes.bool               // apply JS animation, regardless of browser
  };

  // defaults
  static defaultProps = {
    className: 'mt-svg',
    animate:   false,
    duration:  1000,
    stagger:   0,
    timing:    'ease',
    playback:  'forwards',
    fade:      false,
    callback:  () => {},
    jsOnly:    false
  };


  constructor( props ) {
    super( props );

    this.state = {
      classKey:      '',      // unique class name for the wrapper, acts as internal "trigger" (re-generated each time anim is to run)
      css:           '',      // generated CSS
      tweenElapsed:  0,       // tween duration so far (ms)
      tweenProgress: 0        // tween completion (pct)
    };

    this._lastAnimate  = '';
    this._lastClassKey = '';

    this._animStart    = 0;    // anim start timestamp (CSS & JS)
    this._tweenLast    = 0;    // last tween update timestamp (JS)

    this._pathElems    = [];
    this._pathDataFrom = {};
    this._pathDataTo   = {};
    this._tweenData    = {};
  }


  componentWillMount() {
    this._setClassKey( this.props.animate );
  }


  componentWillReceiveProps( nextProps ) {
    this._setClassKey( nextProps.animate );
  }


  render() {
    // destruct all component-specific props, so '...rest' can be applied to wrapper <span>
    const { className, animate, duration, stagger, timing, playback, fade, jsOnly, children, ...rest } = this.props;
    const { classKey, css } = this.state;
    const isHidden = animate === 'hide';

    return (
      <span
        ref={ ( c ) => this._svgWrapper = c }
        className={ `${ className } ${ classKey }` }
        style={ { opacity: isHidden ? 0.01 : 1 } }
        { ...rest }
      >
        { !jsOnly && <style>{ css }</style> }
        { children }
      </span>
    );
  }


  componentDidMount() {
    this._animate();
  }


  componentDidUpdate() {
    this._animate();
  }


  // ------------------------------------------------------

  /*
   * Main animate handler, called after each render update
   */
  _animate() {
    const { animate, duration, stagger, timing, playback, jsOnly }  = this.props;
    const { classKey } = this.state;

    const isStartNewAnim = animate !== false && classKey !== this._lastClassKey;
    const isAnimJS       = isMsBrowser() || jsOnly;

    // STARTING NEW ANIMATION...
    if ( isStartNewAnim ) {

      // set flags
      this._animStart    = Date.now();
      this._lastClassKey = classKey;

      // parse out vars common for both modes
      const startDelay = typeof animate === 'number' ? animate : 0;   // if numeric, treat as delay (ms)
      let numOfRepeats = parseInt( playback, 10 ) || 0;

      /* ----- JS MODE ----- */
      if ( isAnimJS ) {

        // parse props for use with Tween.js
        if ( numOfRepeats > 0 ) { numOfRepeats = numOfRepeats - 1; }
        if ( contains( playback, 'infinite' ) ) { numOfRepeats = Infinity; }
        const isYoYo = contains( playback, 'alternate' );

        // acquire path elems and generate to/from data sets
        this._pathElems    = this._selectPathElems();
        const pathData     = this._getPathData( this._pathElems );
        this._pathDataFrom = pathData.from;
        this._pathDataTo   = pathData.to;

        // TODO: if ( contains( playback, 'reverse' ) ) { ... };

        // init tweener object
        this._tweenData = { ...this._pathDataFrom };

        // set paths' offsets to start positions
        this._setStrokeDasharray( this._pathElems, this._pathDataFrom );
        this._setStrokeDashoffset( this._pathElems, this._tweenData );

        // init the tweener..
        const tween = new TWEEN.Tween( this._tweenData )
          .to( this._pathDataTo, duration )
          .easing( EASING[ timing ] )
          .repeat( numOfRepeats )
          .yoyo( isYoYo )
          .onUpdate( this._onTweenUpdate )
          .onComplete( this._onAnimComplete );

        // kick off JS tweening..
        const t = setTimeout( () => {
          tween.start();
          TWEEN.update();
          clearTimeout( t );
        }, Math.max( 1, startDelay ) );

      /* ----- CSS MODE ----- */
      } else {

        let css ='';

        // 1) determine number of path elems in svg
        const pathLenghts = this._getPathLengths();
        const pathQty     = pathLenghts.length || 1;

        // 2) calc all timing values
        const staggerMult      = clamp( stagger, 0, 100 ) / 100;                        // convert percentage to 0-1
        const pathStaggerDelay = ( stagger > 0 ? duration/pathQty * staggerMult : 0 );
        const pathDrawDuration = ( stagger > 0 ? duration - (( pathStaggerDelay * ( pathQty - 1 ) ) * ( 2 - staggerMult )) : duration );

        // 3) concat generated CSS, one path at a time..
        pathLenghts.forEach( ( length, index ) => {
          css += this._getPathCSS( index, length, startDelay, pathStaggerDelay, pathDrawDuration );
        });

        // set up on-complete timer
        const t = setTimeout( () => {
          clearTimeout( t );
          this._onAnimComplete();
        }, startDelay + duration * ( numOfRepeats ) );

        // set state (re-render)
        this.setState( { css } );
      }


    // ONGOING ANIMATION...
    } else if ( this._animStart ) {

      /* ----- JS MODE ----- */
      if ( isAnimJS ) {
        requestAnimationFrame( TWEEN.update );

      /* ----- CSS MODE ----- */
      } else {
        // NOTE: nothing to do, browser does its thing...
      }
    }
  }


  /*
   * After each Tween update, set state to re-render..
   */
  _onTweenUpdate = () => {
    const { duration }  = this.props;
    const tweenElapsed  = this._getTweenElapsed();
    const tweenProgress = Math.ceil( tweenElapsed / ( duration || 1 ) * 100 );
    this._tweenLast     = Date.now();

    this._setStrokeDashoffset( this._pathElems, this._tweenData );

    this.setState({ tweenElapsed, tweenProgress });
  }


  /*
   * When animation completes, run callback (if any), clear start timestamp
   */
  _onAnimComplete = () => {
    // console.log( 'completed in:', Date.now() - this._animStart );
    this.props.callback();
    this._animStart = 0;
  }


  /*
   * Return duration of ongoing tween thus far (ms)
   */
  _getTweenElapsed() {
    return this._animStart ? Date.now() - this._animStart : 0;
  }


  /*
   * Acquire selection of SVG 'path' elems contained within
   */
  _selectPathElems() {
    const svgEl = findDOMNode( this._svgWrapper ).getElementsByTagName( 'svg' )[0];
    return svgEl ? svgEl.querySelectorAll( 'path' ) : [];
  }


  /*
   * Generate an object containing 'from' and 'to' sub-objects
   * Each object contains same set of indexed keys, per the path selection
   * The 'from' object values are the paths' lengths
   * The 'to' object values are 0 (unless 'skip' attr is present, then equal path's length)
   */
  _getPathData( pathElems ) {
    const pathData = { from: {}, to: {} };

    [].forEach.call( pathElems, ( pathEl, i ) => {
      if ( !this._hasSkipAttr( pathEl.attributes ) ) {
        const pathLengh  = trimFloat( pathEl.getTotalLength() );
        pathData.to[ i ]   = 0;
        pathData.from[ i ] = pathLengh;
      }
    });

    return pathData;
  }

  /*
   * Check path's attributes for data-mt="skip"
   */
  _hasSkipAttr( attributes ) {
    let result = false;

    // path.attributes is an obj with indexed keys, so we must iterate over them
    // { '0': { name: 'd', value: 'M37.063' }, '1': { name: 'data-mt', value: 'skip' }, ... }
    for( let key in attributes ) {
      const { name, value } = attributes[ key ];
      if ( !result && name === 'data-mt' && value === 'skip' ) {
        result = true;
        break;
      }
    }

    return result;
  }


  /*
   * Set style.strokeDasharray on all paths in selection, from the provided key-val object
   */
  _setStrokeDasharray( pathElems, pathData ) {
    [].forEach.call( pathElems, ( pathEl, i ) => {
      if ( pathData[ i ] ) { pathEl.style.strokeDasharray = pathData[ i ]; }
    });
  }


  /*
   * Set style.strokeDashoffset on all paths in selection, from the provided key-val object
   */
  _setStrokeDashoffset( pathElems, pathData ) {
    [].forEach.call( pathElems, ( pathEl, i ) => {
      if ( pathData[ i ] ) { pathEl.style.strokeDashoffset = pathData[ i ]; }
    });
  }


  /*
   * Return an array containing lengths of all path elems inside the SVG
   * TODO: consolidate/reuse _getPathData ?
   */
  _getPathLengths() {
    const pathElems = this._selectPathElems();
    return [].map.call( pathElems, ( pathEl ) => {
      return this._hasSkipAttr( pathEl.attributes ) ? 0 : trimFloat( pathEl.getTotalLength() );
    });
  }


  /*
   * Return CSS for a single path elem (using classKey and path index as the CSS selector)
   */
  _getPathCSS( index, length, startDelay, staggerDelay, duration ) {
    const { classKey } = this.state;
    const { timing, playback, fade } = this.props;

    const keysId       = `${ classKey }-${ index + 1 }`;
    const totalDelay   = length ? trimFloat( ( startDelay + staggerDelay * index ) / 1000 ) : 0;
    const startOpacity = fade ? 0.01 : 1;

    duration = duration ? trimFloat( duration / 1000 ) : 0;

    return `
      @keyframes ${ keysId } {
        0%   { stroke-dashoffset: ${ length }; opacity: ${ startOpacity }; }
        100% { stroke-dashoffset: 0; opacity: 1; }
      }
      .${ classKey } path:nth-of-type( ${ index + 1 } ) {
        opacity:                 0.01;
        stroke-dasharray:        ${ length };
        stroke-dashoffset:       ${ length };
        -webkit-animation:       ${ keysId } ${ duration }s ${ timing } ${ playback };
        animation:               ${ keysId } ${ duration }s ${ timing } ${ playback };
        -webkit-animation-delay: ${ totalDelay }s;
        animation-delay:         ${ totalDelay }s;
      }
    `;
  }


  /*
   * Check if animate flag is new, and if true, set a new classKey into state (trigger anim)
   */
  _setClassKey( animate ) {
    if ( animate !== this._lastAnimate ) {
      this._lastAnimate = animate;
      this.setState( { classKey: `mt-${ shortUID() }` } );
    }
  }
}
