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

        <div style={ styles.column }>
          <MtSvgLines
            animate={ triggerCheckAnim }
            jsOnly={ false }
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
            animate={ triggerCheckAnimJS }
            jsOnly={ true }
          >
            <SvgCheckmark />
          </MtSvgLines>

          <div style={ styles.info }>
            { this._renderTrigger( 'triggerCheckAnimJS') }
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

      </div>
    );
  }

  // button partial
  _renderTrigger( triggerProp ) {
    return (
      <a style={ styles.link }
        href="#"
        data-trigger={ triggerProp }
        onClick={ this._handleAnimateClick }
      >
        animate &raquo;
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
