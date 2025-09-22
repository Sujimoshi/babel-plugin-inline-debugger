/**
 * Main application with inline debugging
 */

import { add, multiply, power, calculateArea, calculatePerimeter } from './math';
import { formatUser, validateUser, createUser, User } from './user';

export interface AppResult {
  math: {
    sum: number;
    product: number;
    powerResult: number;
  };
  geometry: {
    area: number;
    perimeter: number;
  };
  user: {
    formatted: string;
    isValid: boolean;
  };
  error: string;
}

export async function runApp(): Promise<AppResult> {
  // Math operations
  const a = 5; //?
  const b = 3; //?
  
  const sum = add(a, b); //?
  const product = multiply(a, b); //?
  const powerResult = power(a, b); //?
  
  console.log('Math results:', { sum, product, powerResult }); //?
  
  // Geometry calculations
  const length = 10; //?
  const width = 5; //?
  
  const area = calculateArea(length, width); //?
  const perimeter = calculatePerimeter(length, width); //?
  
  console.log('Area calculations:', { area, perimeter }); //?
  
  // User operations
  const user: User = { name: 'John', age: 25 };
  const formatted = formatUser(user); //?
  const isValid = validateUser(user); //?
  
  console.log('User operations:', { formatted, isValid }); //?
  
  // Error handling
  let errorMessage = '';
  try {
    createUser('', 30); //?
  } catch (error) {
    errorMessage = (error as Error).message;
    console.log('Caught error:', errorMessage); //?
  }
  
  return {
    math: { sum, product, powerResult },
    geometry: { area, perimeter },
    user: { formatted, isValid },
    error: errorMessage
  };
}
