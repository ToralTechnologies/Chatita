// Email allowlist for restricted access control

/**
 * Gets the list of allowed emails from environment variable
 * @returns Array of allowed email addresses (lowercase, trimmed)
 */
export function getAllowedEmails(): string[] {
  const allowedEmailsEnv = process.env.ALLOWED_EMAILS || '';

  if (!allowedEmailsEnv.trim()) {
    return [];
  }

  return allowedEmailsEnv
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * Checks if an email is allowed to access the application
 * SECURITY: If no allowlist is configured (empty), blocks ALL access
 * @param email - Email address to check
 * @returns true if email is in allowlist, false otherwise
 */
export function isEmailAllowed(email: string): boolean {
  const allowedEmails = getAllowedEmails();

  // SECURITY: If no allowlist is configured, BLOCK all access
  if (allowedEmails.length === 0) {
    console.warn('⚠️  ALLOWED_EMAILS is empty - blocking all access for security.');
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return allowedEmails.includes(normalizedEmail);
}

/**
 * Gets a formatted list of allowed emails (for admin/debugging purposes)
 * @returns Comma-separated string of allowed emails
 */
export function getFormattedAllowedEmails(): string {
  const emails = getAllowedEmails();
  if (emails.length === 0) {
    return 'No emails configured';
  }
  return emails.join(', ');
}
