export const APP_CONFIG = {
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'indian_invoice_fraud_detector_super_secret_jwt_key_2025',
  JWT_EXPIRES_IN: '7d',
  OUR_COMPANY_GSTIN: '27AAACG1234F1Z5',
  OUR_COMPANY_STATE_CODE: '27',
  OUR_COMPANY_STATE: 'Maharashtra',
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  UPLOAD_DIR: 'uploads',
};

export const RISK_THRESHOLDS = {
  LOW_MAX: 24,
  MEDIUM_MAX: 49,
  HIGH_MAX: 74,
  CRITICAL_MIN: 75,
};

export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export const RULE_STATUS = {
  PASS: 'PASS',
  WARNING: 'WARNING',
  FAIL: 'FAIL',
  CRITICAL: 'CRITICAL',
} as const;

export const INVOICE_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  SUSPICIOUS: 'SUSPICIOUS',
  FLAGGED_FRAUD: 'FLAGGED_FRAUD',
  REJECTED: 'REJECTED',
} as const;

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  AUDITOR: 'AUDITOR',
  FINANCE_USER: 'FINANCE_USER',
} as const;

// Standard Indian GST Tax Rates
export const VALID_GST_RATES = [0, 5, 12, 18, 28];

// Indian State Code Mapping (01 to 38)
export const INDIAN_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
};
