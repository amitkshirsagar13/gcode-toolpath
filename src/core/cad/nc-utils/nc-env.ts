/**
 * Defined to allow multiple environment defining functions to be during vector/nc generation.
 */

// measurement unit translator

/**
 * 
 * @param {*} val 
 * @returns 
 */
export const in2mm = (val: number = 0): number => val * 25.4;
/**
 * 
 * @param {*} val 
 * @returns 
 */
export const mm2in = (val: number = 0): number  => val / 25.4;

