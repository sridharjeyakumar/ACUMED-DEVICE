/**
 * Safely converts a value to a number, returning null for invalid values instead of NaN
 * @param value - The value to convert to a number
 * @returns The number value, or null if the value is invalid/empty
 */
export function safeNumber(value: any): number | null {
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Handle whitespace-only strings
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }
  
  // Convert to number
  const num = Number(value);
  
  // Return null if conversion resulted in NaN
  if (isNaN(num)) {
    return null;
  }
  
  return num;
}

/**
 * Safely converts a value to an integer, returning null for invalid values
 * @param value - The value to convert to an integer
 * @returns The integer value, or null if the value is invalid/empty
 */
export function safeInteger(value: any): number | null {
  const num = safeNumber(value);
  if (num === null) {
    return null;
  }
  return Math.floor(num);
}






