import React, { PropTypes } from 'react';
import { findDOMNode } from 'react-dom';
import { shortUID, clamp, trimFloat } from './utils.js';

import TWEEN from 'tween.js';
import { VelocityComponent } from "velocity-react";

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
    fade:      PropTypes.bool               // apply a fade-in to each path
  };

  // defaults
  static defaultProps = {
    className: 'mt-svg',
    animate:   false,
    duration:  1000,
    stagger:   0,
    timing:    'ease',
    playback:  'forwards',
    fade:      false
  };


  constructor( props ) {
    super( props );

    // classKey is a unique class name, used as internal anim "trigger" (re-generated each time anim is to run)
    this.state = {
      classKey:      '',      // unique class name for the wrapper, acts as an internal "trigger"
      css:           '',      // generated CSS
      tweenTimer:    0,
      tweenProgress: 0
    };

    this._lastAnimate  = '';
    this._lastClassKey = '';
    this._tweenStart   = 0;
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
        ref={ ( c ) => this._svg = c }
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

  _animate() {
    const { animate, duration }  = this.props;
    const { classKey } = this.state;
    
    // if new animation triggered...
    if ( animate && classKey !== this._lastClassKey ) {
      
      // JS tweening TODO: add browser check
      if ( !this._tweenStart ) {
        const startDelay = typeof animate === 'number' ? animate : 0;   // if numeric, treat as delay (ms)
        const pathElems  = this._getPathElems();                        // select path elems
        this._pathData   = this._getPathData( pathElems );         // generate to/from data sets
        this._tweenData  = { ...this._pathData.from };                  // set tween object at start values
        
        // start the tweener..
        const tween = new TWEEN.Tween( this._tweenData )
          .to( this._pathData.to, duration )
          .onUpdate( this._onTweenUpdate )
          .onComplete( this._onTweenComplete )
          .start();
          
        // set flags
        this._lastClassKey = classKey;
        this._tweenStart   = Date.now();
        
        TWEEN.update();
      }
      // ELSE, call: this._refreshCSS();
    
    // ongoing animation...
    } else {
      
      // JS tweening TODO: add browser check
      if ( this._tweenStart ) {
        
        // re-acquire svg paths
        const pathElems = this._getPathElems();
        
        // apply tweened dash-offset to each path
        [].forEach.call( pathElems, ( pathEl, i ) => {
          pathEl.style.strokeDasharray  = this._pathData.from[ i ];
          pathEl.style.strokeDashoffset = this._tweenData[ i ];
        });
        
        // trigger reflow!
        const t = setTimeout( () => {
          TWEEN.update();
          clearTimeout( t );
        }, 0 );                   // TODO: maybe add throttling here?
      }
    }
  }
  
  _onTweenUpdate = () => {
    // TODO: ADD THROTTLING?
    const { duration }  = this.props;
    const tweenTimer    = this._tweenStart ? Date.now() - this._tweenStart : 0;
    const tweenProgress = Math.ceil( tweenTimer / ( duration || 1 ) * 100 );
    this.setState({ tweenTimer, tweenProgress });
  }
  
  _onTweenComplete = () => {
    this._tweenStart = 0;
    console.log( '----------> DONE!', this._tweenStart );
  }

  _getPathData( pathElems ) {
    const tweenData = { from: {}, to: {} };
    [].forEach.call( pathElems, ( pathEl, i ) => {
      tweenData.to[ i ]   = 0;
      tweenData.from[ i ] = trimFloat( pathEl.getTotalLength() );   // TODO: add check for hasSkipAttr!
    });
    return tweenData;
  }
  
  _getPathElems() {
    const svgEl = findDOMNode( this._svg ).getElementsByTagName( 'svg' )[0];
    return svgEl ? svgEl.querySelectorAll( 'path' ) : [];
  }
  

  
  
  
  
  // ADAPT INTO/FOR _getPathData
  _getPathLengths( pathElems ) {
    return [].map.call( pathElems, ( path ) => {
      return this._hasSkipAttr( path.attributes ) ? 0 : trimFloat( path.getTotalLength() );
    });
  }
  
  // helper: check path attributes for data-mt="skip"
  _hasSkipAttr( attributes ) {
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
  
  
  // --- ORIGINAL STUFF ---
  
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
      const pathElems = findDOMNode( this._svg )
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
