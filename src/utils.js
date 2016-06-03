/*
 * Clamp a number within the specified min-max range
 */
export function clamp( value, min, max ) {
  return Math.min( Math.max( value, min ), max );
}


/*
 * Round a float to 2 decimal places
 */
export function trimFloat( value ) {
  return Math.round( value * 100 ) / 100;
}


/*
 * Generate a short UID (4 chars)
 * http://stackoverflow.com/questions/6248666/how-to-generate-short-uid-like-ax4j9z-in-js
 */
export function shortUID() {
  return ( '0000' + ( Math.random() * Math.pow( 36, 4 ) << 0 ).toString( 36 ) ).slice( -4 );
}

/*
 * Determine if Microsoft browser (IE8+ or Edge)
 */
export function isMsBrowser() {
  return Boolean( document.documentMode || /Edge/.test( navigator.userAgent ) );
}


/*
 * Determine if value is present in array (or string), return bool
 */
export function contains( arrayOrString, value  ) {
  return arrayOrString.indexOf( value ) > -1;
}
