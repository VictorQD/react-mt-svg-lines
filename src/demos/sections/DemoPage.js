import React from 'react';

import MtSvgLines from '../../MtSvgLines';
// import MtSvgLines from './../../dist/';

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

      triggerCheckAnimJS:   true,
      triggerSigAnimJS:     true,
      triggerChartAnimJS:   true,
      triggerSpinnerAnimJS: true
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
      triggerSpinnerAnimJS,
    } = this.state;

    return (
      <div style={ styles.wrapper }>
        <span style={ styles.gitHub }><a href="https://github.com/moarwick/react-mt-svg-lines">GitHub &raquo;</a></span>
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
  _renderTrigger( triggerProp, label="animate »" ) {
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
  gitHub: {
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
    clear: "both"
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
