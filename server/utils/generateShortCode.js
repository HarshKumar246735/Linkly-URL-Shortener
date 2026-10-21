import { customAlphabet } from 'nanoid';

// 62 characters ^ 7 positions = ~3.5 trillion combinations.
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const SHORT_CODE_LENGTH = 7;

const nano = customAlphabet(ALPHABET, SHORT_CODE_LENGTH);

export const generateShortCode = () => nano();
