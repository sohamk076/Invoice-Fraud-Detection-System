import { INDIAN_STATE_CODES } from '../config/constants';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const CHAR_MAP = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface GSTINValidationResult {
  isValidFormat: boolean;
  isValidState: boolean;
  isValidChecksum: boolean;
  isValidOverall: boolean;
  stateCode: string;
  stateName: string | null;
  extractedPan: string;
  isPanFormatValid: boolean;
  errorMessage?: string;
}

/**
 * Calculates Indian GSTIN 15th character checksum based on the official MOD 36 algorithm.
 */
export function calculateGSTINCheckDigit(gstin14: string): string {
  if (gstin14.length < 14) return '';

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const char = gstin14[i].toUpperCase();
    const charValue = CHAR_MAP.indexOf(char);
    if (charValue === -1) return '';

    // Factor is 1 for even index (0-based) and 2 for odd index
    const factor = (i % 2 === 0) ? 1 : 2;
    const multiplied = charValue * factor;
    const quotient = Math.floor(multiplied / 36);
    const remainder = multiplied % 36;
    sum += quotient + remainder;
  }

  const checkDigitIndex = (36 - (sum % 36)) % 36;
  return CHAR_MAP[checkDigitIndex];
}

/**
 * Validates an Indian GSTIN comprehensively (Format, State Code, PAN substring, and Checksum).
 */
export function validateGSTIN(gstin: string | null | undefined): GSTINValidationResult {
  if (!gstin || typeof gstin !== 'string') {
    return {
      isValidFormat: false,
      isValidState: false,
      isValidChecksum: false,
      isValidOverall: false,
      stateCode: '',
      stateName: null,
      extractedPan: '',
      isPanFormatValid: false,
      errorMessage: 'GSTIN is missing or empty.',
    };
  }

  const cleanGstin = gstin.trim().toUpperCase();

  // 1. Format Regex Check
  const isValidFormat = GSTIN_REGEX.test(cleanGstin);
  if (!isValidFormat) {
    return {
      isValidFormat: false,
      isValidState: false,
      isValidChecksum: false,
      isValidOverall: false,
      stateCode: cleanGstin.substring(0, 2),
      stateName: null,
      extractedPan: cleanGstin.length >= 12 ? cleanGstin.substring(2, 12) : '',
      isPanFormatValid: false,
      errorMessage: `GSTIN "${cleanGstin}" fails 15-character format pattern (2 digits + 10-char PAN + 1 entity num + 'Z' + 1 checksum).`,
    };
  }

  // 2. State Code Verification
  const stateCode = cleanGstin.substring(0, 2);
  const stateName = INDIAN_STATE_CODES[stateCode] || null;
  const isValidState = stateName !== null;

  // 3. PAN Substring Verification
  const extractedPan = cleanGstin.substring(2, 12);
  const isPanFormatValid = PAN_REGEX.test(extractedPan);

  // 4. Checksum Verification
  const expectedCheckDigit = calculateGSTINCheckDigit(cleanGstin.substring(0, 14));
  const actualCheckDigit = cleanGstin[14];
  const isValidChecksum = expectedCheckDigit === actualCheckDigit;

  const isValidOverall = isValidFormat && isValidState && isPanFormatValid && isValidChecksum;

  let errorMessage: string | undefined;
  if (!isValidState) {
    errorMessage = `Invalid state code "${stateCode}" in GSTIN.`;
  } else if (!isPanFormatValid) {
    errorMessage = `Invalid embedded PAN "${extractedPan}" in GSTIN.`;
  } else if (!isValidChecksum) {
    errorMessage = `GSTIN checksum mismatch: Expected "${expectedCheckDigit}", but got "${actualCheckDigit}".`;
  }

  return {
    isValidFormat,
    isValidState,
    isValidChecksum,
    isValidOverall,
    stateCode,
    stateName,
    extractedPan,
    isPanFormatValid,
    errorMessage,
  };
}
