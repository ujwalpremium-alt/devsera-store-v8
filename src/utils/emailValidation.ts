// List of allowed email domains (popular and trusted email providers)
export const ALLOWED_EMAIL_DOMAINS = [
  // Google
  'gmail.com',
  'googlemail.com',
  // Microsoft
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  // Yahoo
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'ymail.com',
  // Apple
  'icloud.com',
  'me.com',
  'mac.com',
  // Other popular providers
  'protonmail.com',
  'proton.me',
  'aol.com',
  'zoho.com',
  'mail.com',
  'gmx.com',
  'gmx.net',
  // Indian providers
  'rediffmail.com',
  // Educational (common patterns)
  'edu',
];

// Basic email format validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmail(email: string): EmailValidationResult {
  // Trim and lowercase the email
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email is empty
  if (!normalizedEmail) {
    return { isValid: false, error: 'Email is required' };
  }

  // Check basic email format
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Allow all @devsera.store emails (admin accounts)
  if (normalizedEmail.endsWith('@devsera.store')) {
    return { isValid: true };
  }

  // Extract domain from email
  const domain = normalizedEmail.split('@')[1];

  if (!domain) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check if domain is in allowed list
  const isAllowedDomain = ALLOWED_EMAIL_DOMAINS.some(allowedDomain => {
    // Exact match
    if (domain === allowedDomain) return true;
    // Check for educational domains (ends with .edu)
    if (allowedDomain === 'edu' && domain.endsWith('.edu')) return true;
    return false;
  });

  if (!isAllowedDomain) {
    return {
      isValid: false,
      error: 'Please use a valid email from Gmail, Yahoo, Outlook, iCloud, or other major providers. Temporary or disposable emails are not allowed.',
    };
  }

  return { isValid: true };
}

// Get list of allowed domains for display
export function getAllowedDomainsDisplay(): string {
  return '';
}
