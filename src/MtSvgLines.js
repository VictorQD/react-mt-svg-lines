import React, { PropTypes } from 'react';
import { findDOMNode } from 'react-dom';
import { shortUID, clamp, trimFloat, isMsBrowser } from './utils.js';
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
    jsOnly:    false
  };


  constructor( props ) {
    super( props );

    // classKey is a unique class name, used as internal anim "trigger" (re-generated each time anim is to run)
    this.state = {
      classKey:      '',      // unique class name for the wrapper, acts as an internal "trigger"
      css:           '',      // generated CSS
      tweenElapsed:  0,       // tween duration so far (ms)
      tweenProgress: 0        // tween completion (pct)
    };

    this._lastAnimate  = '';
    this._lastClassKey = '';
    
    this._tweenStart   = 0;   // anim start timestamp
    this._tweenLast    = 0;   // last tween update timestamp
    
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
    const { className, animate, duration, stagger, timing, children, ...props } = this.props;
    const { classKey, css } = this.state;

    return (
      <span
        ref={ ( c ) => this._svgWrapper = c }
        className={ `${ className } ${ classKey }` }
        { ...props }
      >
        <style>
          { css }
        </style>

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
    const { animate, duration, timing, playback }  = this.props;
    const { classKey } = this.state;
    
    // if should start new animation...
    if ( animate && classKey !== this._lastClassKey ) {
      
      // JS tweening TODO: add browser check
      if ( !this._tweenStart ) {
        // set flags
        this._tweenStart   = Date.now();
        this._lastClassKey = classKey;
        
        // parse props
        const startDelay = typeof animate === 'number' ? animate : 0;   // if numeric, treat as delay (ms)
        const isReverse  = playback.includes( 'reverse' );
        const isYoYo     = playback.includes( 'alternate-reverse' ) && playback.includes( 'both' );
        let numOfRepeats = parseInt( playback, 10 ) || 0;
        
        if ( numOfRepeats > 0 ) { numOfRepeats = numOfRepeats - 1; }
        if ( playback.includes( 'infinite' ) ) { numOfRepeats = Infinity; }
        
        // acquire path elems and generate to/from data sets
        this._pathElems = this._selectPathElems();
        const pathData  = this._getPathData( this._pathElems );
        
        if ( isReverse && !isYoYo ) {
          this._pathDataFrom = pathData.to;
          this._pathDataTo   = pathData.from;
          this._tweenData    = { ...this._pathDataFrom };
          
        } else {
          this._pathDataFrom = pathData.from;
          this._pathDataTo   = pathData.to;
          this._tweenData    = { ...this._pathDataFrom };
        }
        
        // set paths'offsets to start positions
        this._setStrokeDasharray( this._pathElems, this._pathDataFrom );
        this._setStrokeDashoffset( this._pathElems, this._tweenData );
        
        // init the tweener..
        const tween = new TWEEN.Tween( this._tweenData )
          .to( this._pathDataTo, duration )
          .easing( EASING[ timing ] )
          .repeat( numOfRepeats )
          .onUpdate( this._onTweenUpdate )
          .onComplete( this._onTweenComplete );
        
        if ( isYoYo ) { tween.yoyo( true ); }

        // kick off JS tweening..
        const t = setTimeout( () => {
          tween.start()
          TWEEN.update();
          clearTimeout( t );
        }, Math.max( 0, startDelay ) );
      }
      // ELSE, call: this._refreshCSS();
    
    // ongoing animation...
    } else {
      
      // JS tweening TODO: add browser check
      if ( this._tweenStart ) {
        // apply tweened dash-offsets to all paths
        this._setStrokeDashoffset( this._pathElems, this._tweenData );

        // reflow and trigger update (after throttheld delay 'til next "frame")
        const frameDelay = MS_PER_UPDATE - ( Date.now() - this._tweenLast );
        const t = setTimeout( () => {
          TWEEN.update();
          clearTimeout( t );
        }, Math.max( 0, frameDelay ) );
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
    this.setState({ tweenElapsed, tweenProgress });
  }
  
  /*
   * When animation completes, clear start timestamp
   */
  _onTweenComplete = () => {
    this._tweenStart = 0;
  }

  /*
   * Return duration of ongoing tween thus far (ms)
   */
  _getTweenElapsed() {
    return this._tweenStart ? Date.now() - this._tweenStart : 0;
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
      const isSkipAttr   = this._hasSkipAttr( pathEl.attributes );
      const pathLengh    = trimFloat( pathEl.getTotalLength() );
      pathData.to[ i ]   = isSkipAttr ? pathLengh : 0;
      pathData.from[ i ] = pathLengh;
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
      pathEl.style.strokeDasharray = pathData[ i ];
    });
  }
  
  /*
   * Set style.strokeDashoffset on all paths in selection, from the provided key-val object
   */
  _setStrokeDashoffset( pathElems, pathData ) {
    [].forEach.call( pathElems, ( pathEl, i ) => {
      pathEl.style.strokeDashoffset = pathData[ i ];
    });
  }
  

  
  
  // --- ORIGINAL STUFF ---
  
  _getPathLengths( pathElems ) {
    return [].map.call( pathElems, ( path ) => {
      return this._hasSkipAttr( path.attributes ) ? 0 : trimFloat( path.getTotalLength() );
    });
  }
  
  // determine if to generate new classKey based on the incoming 'animate' prop
  _setClassKey( animate ) {
    if ( animate !== this._lastAnimate ) {
      this._lastAnimate = animate;
      this.setState( { classKey: this._getUniqueClassKey() } );
    }
  }

  // (re)generate CSS if 1) the 'animate' prop is truthy, AND 2) the internal 'classKey' changed
  // the CSS refresh in the DOM kicks off the animation
  _refreshCSS() {

    // helper: check path attributes for data-mt="skip"
    function _hasSkipAttr( attributes ) {
      let result = false;

      // path.attributes is an obj with indexed keys, so we must iterate over them
      // { '0': { name: 'd', value: 'M37.063' }, '1': { name: 'data-mt', value: 'skip' }, ... }
      for( let key in attributes ) {
        const { name, value } = attributes[ key ];
        if ( !result && name === 'data-mt' && value === 'skip' ) {
          result = true;
        }
      }

      return result;
    }

    // helper: return an array containing lengths of all path elems inside the SVG
    function _getPathLengths() {
      const pathElems = findDOMNode( this._svgWrapper )
        .getElementsByTagName( 'svg' )[0]
        .querySelectorAll( 'path' ) || [];

      return [].map.call( pathElems, ( path ) => {
        return _hasSkipAttr( path.attributes ) ? 0 : trimFloat( path.getTotalLength() );
      });
    }

    // helper: return CSS for a single path elem (using classKey and path index as the CSS selector)
    function _getPathCSS( index, length, startDelay, staggerDelay, duration ) {
      const { classKey } = this.state;
      const { timing, playback, fade } = this.props;

      const keysId       = `${ classKey }-${ index + 1 }`;
      const totalDelay   = length ? trimFloat( ( startDelay + staggerDelay * index ) / 1000 ) : 0;
      const startOpacity = fade ? 0.01 : 1;

      duration = duration ? trimFloat( duration / 1000 ) : 0;

      return `
        @keyframes ${ keysId } {
          0%   { stroke-dashoffset: ${ length }px; opacity: ${ startOpacity }; }
          100% { stroke-dashoffset: 0px; opacity: 1; }
        }
        .${ classKey } path:nth-of-type( ${ index + 1 } ) {
          opacity:                 0.01;
          stroke-dasharray:        ${ length }px;
          stroke-dashoffset:       ${ length }px;
          -webkit-animation:       ${ keysId } ${ duration }s ${ timing } ${ playback };
          animation:               ${ keysId } ${ duration }s ${ timing } ${ playback };
          -webkit-animation-delay: ${ totalDelay }s;
          animation-delay:         ${ totalDelay }s;
        }
      `;
    }

    const { animate, duration, stagger } = this.props;
    const { classKey } = this.state;

    // check if 'animate' prop is truthy AND internal classKey has changed
    if ( animate && classKey !== this._lastClassKey ) {
      let css ='';

      if ( animate === 'hide' ) {
        // if 'hide' passed, set the entire container as ~trasparent
        css=`.${ classKey } { opacity: 0; }`;

      } else {
        // otherwise, animate away..
        // 1) determine number of path elems in svg
        const pathLenghts = _getPathLengths.call( this );
        const pathQty     = pathLenghts.length || 1;

        // 2) calc all timing values
        const startDelay       = typeof animate === 'number' ? animate : 0;   // if numeric, treat as delay (ms)
        const staggerMult      = clamp( stagger, 0, 100 ) / 100;              // convert percentage to 0-1
        const pathStaggerDelay = ( stagger > 0 ? duration/pathQty * staggerMult : 0 );
        const pathDrawDuration = ( stagger > 0 ? duration/pathQty * ( 2 - staggerMult ) : duration );

        // 3) concat generated CSS, one path at a time..
        pathLenghts.forEach( ( length, index ) => {
          css += _getPathCSS.call( this, index, length, startDelay, pathStaggerDelay, pathDrawDuration );
        });
      }

      // remember UID for next refresh
      this._lastClassKey = classKey;

      // set state (re-render)
      this.setState({ css });
    }

  }

  _getUniqueClassKey() {
    return `mt-${ shortUID() }`;
  }

}
