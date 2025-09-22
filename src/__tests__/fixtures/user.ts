/**
 * User utilities with inline debugging
 */

export interface User {
  name: string;
  age: number;
}

export function formatUser(user: User): string {
  return `${user.name} (${user.age})`; //?
}

export function validateUser(user: User): boolean {
  return user.name.length > 0 && user.age > 0; //?
}

export function createUser(name: string, age: number): User {
  if (!name) {
    throw new Error("Name is required"); //?
  }

  return { name, age }; //?
}

export function getUserInfo(user: User): {
  formatted: string;
  isValid: boolean;
} {
  const formatted = formatUser(user);
  const isValid = validateUser(user);

  return { formatted, isValid };
}
