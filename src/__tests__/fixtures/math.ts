/**
 * Math utilities with inline debugging
 */

export function add(a: number, b: number): number {
  return a + b; //?
}

export function multiply(a: number, b: number): number {
  return a * b; //?
}

export function power(base: number, exponent: number): number {
  return Math.pow(base, exponent); //?
}

export function calculateArea(length: number, width: number): number {
  return length * width; //?
}

export function calculatePerimeter(length: number, width: number): number {
  for (const key in { a: 1, b: 2 }) {
    console.log(key); //?
  }
  return 2 * (length + width); //?
}
