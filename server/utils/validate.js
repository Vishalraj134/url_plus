/**
 * validate.js
 * Validates a URL string before any network call is made.
 * Returns { valid: true } or { valid: false, reason: string }.
 */

/**
 * Checks that:
 *  1. The value is a non-empty string
 *  2. It can be parsed by the URL constructor (well-formed)
 *  3. The protocol is http: or https: (rejects ftp, file, javascript, etc.)
 *
 * @param {*} url - Raw input from the request body
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { valid: false, reason: 'A URL is required.' };
  }

  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    // URL constructor throws for malformed strings (missing protocol, invalid chars, etc.)
    return {
      valid: false,
      reason: `"${url}" is not a valid URL. Make sure it starts with http:// or https://.`,
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      valid: false,
      reason: `Only http and https URLs are supported (got "${parsed.protocol}").`,
    };
  }

  return { valid: true };
}

module.exports = { validateUrl };
