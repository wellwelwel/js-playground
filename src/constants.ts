export const SANDBOX_MARKER = 'js-playground';

export const DEFAULT_CODE = `const numbers = [1, 2, 3, 4];
const doubled = numbers.map((value) => value * 2);
const sum = doubled.reduce((sum, value) => sum + value, 0);

console.log('Doubled:', doubled);
console.log('Sum:', sum);`;
