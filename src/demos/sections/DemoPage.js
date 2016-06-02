import React from 'react';

import MtSvgLines from '../../MtSvgLines';
// import MtSvgLines from './../../dist/';  // NOTE: uncomment to test built lib

import SvgCheckmark from '../components/SvgCheckmark';
import SvgSignature from '../components/SvgSignature';
import SvgChart from '../components/SvgChart';
import SvgSpinner from '../components/SvgSpinner';

export default class DemoPage extends React.Component {
  constructor( props ) {
    super( props );

    this.state = {
      triggerCheckAnim:     true,
      triggerSigAnim:       true,
      triggerChartAnim:     true,
      triggerSpinnerAnim:   true,

      triggerCheckAnimJS:   false,
      triggerSigAnimJS:     false,
      triggerChartAnimJS:   false,
      triggerSpinnerAnimJS: false
    };
  }

  render() {
    const {
      triggerCheckAnim,
      triggerSigAnim,
      triggerChartAnim,
      triggerSpinnerAnim,

      triggerCheckAnimJS,
      triggerSigAnimJS,
      triggerChartAnimJS,
      triggerSpinnerAnimJS
    } = this.state;

    return (
      <div style={ styles.wrapper }>
        <a href="https://github.com/moarwick/react-mt-svg-lines" style={ styles.gitHubLink }>
          { this._renderGithubLogo() }
        </a>
        <h2 style={ styles.title }>MtSvgLines</h2>

        {/* ----- CSS MODE ----- */}

        <div style={ styles.row }>
          <div style={ styles.column }>
            <MtSvgLines
              animate={ triggerCheckAnim }
            >
              <SvgCheckmark />
            </MtSvgLines>

            <div style={ styles.info }>
              { this._renderTrigger( 'triggerCheckAnim') }
              <p style={ styles.props }>
                <em>default props</em><br/>
                duration: <strong>1000</strong><br/>
                stagger:  <strong>0</strong><br/>
                timing:   <strong>ease</strong><br/>
                playback: <strong>forwards</strong><br/>
                fade:     <strong>false</strong>
              </p>
            </div>
          </div>

          <div style={ styles.column }>
            <MtSvgLines
              animate={ triggerSigAnim }
              duration={ 2000 }
              stagger={ 100 }
              timing="linear"
            >
              <SvgSignature />
            </MtSvgLines>

            <div style={ styles.info }>
              { this._renderTrigger( 'triggerSigAnim' ) }
              <p style={ styles.props }>
                duration: <strong>2000</strong><br/>
                stagger:  <strong>100</strong><br/>
                timing:   <strong>linear</strong>
              </p>
            </div>
          </div>

          <div style={ styles.column }>
            <MtSvgLines
              animate={ triggerChartAnim }
              duration={ 4000 }
              stagger={ 50 }
              timing="ease-in"
              fade={ true }
            >
              <SvgChart />
            </MtSvgLines>

            <div style={ styles.info }>
              { this._renderTrigger( 'triggerChartAnim' ) }
              <p style={ styles.props }>
                duration: <strong>4000</strong><br/>
                stagger:  <strong>50</strong><br/>
                timing:   <strong>ease-in</strong><br/>
                fade:     <strong>true</strong><br/>
                <em>skip path</em>
              </p>
            </div>
          </div>

          <div style={ styles.column }>
            <MtSvgLines
              animate={ triggerSpinnerAnim }
              duration={ 1500 }
              stagger={ 20 }
              timing="linear"
              playback="2 alternate-reverse both"
            >
              <SvgSpinner />
            </MtSvgLines>

            <div style={ styles.info }>
              { this._renderTrigger( 'triggerSpinnerAnim' ) }
              <p style={ styles.props }>
                duration: <strong>1500</strong><br/>
                stagger:  <strong>20</strong><br/>
                timing:   <strong>linear</strong><br/>
                playback: <strong>2 alternate-reverse both</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ----- JS MODE ----- */}

        <div style={ styles.row }>
          <div style={ styles.column }>
            <MtSvgLines
              animate={ triggerCheckAnimJS }
              jsOnly={ true }
            >
              <SvgCheckmark />
            </MtSvgLines>
            <div style={ styles.info }>
              { this._renderTrigger( 'triggerCheckAnimJS', 'JS fallback »' ) }
            </div>
          </div>

          <div style={ styles.column }>
            <MtSvgLines
              animate={ triggerSigAnimJS }
              duration={ 2000 }
              stagger={ 100 }
              timing="linear"
              jsOnly={ true }
            >
              <SvgSignature />
            </MtSvgLines>
            <div style={ styles.info }>
              { this._renderTrigger( 'triggerSigAnimJS', 'JS fallback »' ) }
            </div>
          </div>

          <div style={ styles.column }>
            <MtSvgLines
              animate={ triggerChartAnimJS }
              duration={ 4000 }
              stagger={ 50 }
              timing="ease-in"
              fade={ true }
              jsOnly={ true }
            >
              <SvgChart />
            </MtSvgLines>
            <div style={ styles.info }>
              { this._renderTrigger( 'triggerChartAnimJS', 'JS fallback »' ) }
            </div>
          </div>

          <div style={ styles.column }>
            <MtSvgLines
              animate={ triggerSpinnerAnimJS }
              duration={ 1500 }
              stagger={ 20 }
              timing="linear"
              playback="2 alternate-reverse both"
              jsOnly={ true }
            >
              <SvgSpinner />
            </MtSvgLines>
            <div style={ styles.info }>
              { this._renderTrigger( 'triggerSpinnerAnimJS', 'JS fallback »' ) }
            </div>
          </div>

        </div>

      </div>
    );
  }

  // button partial
  _renderTrigger( triggerProp, label='animate »' ) {
    return (
      <a style={ styles.link }
        href="#"
        data-trigger={ triggerProp }
        onClick={ this._handleAnimateClick }
      >
        { label }
      </a>
    );
  }

  _renderGithubLogo() {
    return (
      <svg viewBox="0 0 54 54" width="32">
        <path fill="#888" d="M26.9,1.9c-13.8,0-25,11.5-25,25.6c0,11.3,7.2,20.9,17.1,24.3
          c1.3,0.2,1.7-0.6,1.7-1.2c0-0.6,0-2.2,0-4.4c-7,1.5-8.4-3.4-8.4-3.4c-1.1-3-2.8-3.7-2.8-3.7c-2.3-1.6,0.2-1.6,0.2-1.6
          c2.5,0.2,3.8,2.6,3.8,2.6c2.2,3.9,5.9,2.8,7.3,2.1c0.2-1.7,0.9-2.8,1.6-3.4C16.8,38.2,11,36,11,26.2c0-2.8,1-5.1,2.6-6.9
          c-0.3-0.6-1.1-3.3,0.2-6.8c0,0,2.1-0.7,6.9,2.6c2-0.6,4.1-0.9,6.3-0.9c2.1,0,4.3,0.3,6.3,0.9c4.8-3.3,6.9-2.6,6.9-2.6
          c1.4,3.5,0.5,6.1,0.2,6.8c1.6,1.8,2.6,4.1,2.6,6.9c0,9.8-5.8,12-11.4,12.6c0.9,0.8,1.7,2.4,1.7,4.7c0,3.4,0,6.2,0,7
          c0,0.7,0.5,1.5,1.7,1.2c9.9-3.4,17.1-13,17.1-24.3C51.9,13.3,40.8,1.9,26.9,1.9z"
        />
      </svg>
    );
  }

  // when any "animate &raquo;" link is clicked, set the corresponding 'animate' prop to trigger it
  _handleAnimateClick = ( e ) => {
    e.preventDefault();

    const triggerKey = e.target.dataset.trigger;    // determine which clicked from its data attr
    const triggerVal = String( Date.now() );        // generate a unique string to pass to 'animate'

    this.setState( { [ triggerKey ]: triggerVal } );
  }
}

const styles = {
  wrapper: {
    maxWidth: '800px',
    margin:   '30px auto 0 auto'
  },
  gitHubLink: {
    float: 'right'
  },
  title: {
    width:         '100%',
    paddingBottom: '10px',
    color:         '#888',
    fontWeight:    '200',
    borderBottom:  '1px dotted #888'
  },
  row: {
    clear: 'both'
  },
  column: {
    width:     '25%',
    float:     'left'
  },
  info: {
    padding: '10px 0 0 4%'
  },
  link: {
    textDecoration: 'none',
    padding:        '0 3px 2px',
    color:          '#E52029',
    border:         '1px solid #E52029',
    borderRadius:   '3px'
  },
  props: {
    fontSize: '12px',
    color:    '#4C6A98'
  }
};
