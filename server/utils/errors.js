/**
 * errors.js
 * Custom error class and error-shape builder for all audit failures.
 * Every error the API returns follows: { success: false, error: { code, message } }
 */

/** Known error codes — used by the frontend to branch on type */
const ErrorCodes = {
  INVALID_URL: 'INVALID_URL',
  NOT_HTML: 'NOT_HTML',
  TIMEOUT: 'TIMEOUT',
  UNREACHABLE: 'UNREACHABLE',
  FETCH_ERROR: 'FETCH_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

/** Maps each error code to the appropriate HTTP response status */
const httpStatusForCode = {
  [ErrorCodes.INVALID_URL]: 400,
  [ErrorCodes.NOT_HTML]: 422,
  [ErrorCodes.TIMEOUT]: 504,
  [ErrorCodes.UNREACHABLE]: 502,
  [ErrorCodes.FETCH_ERROR]: 502,
  [ErrorCodes.INTERNAL_ERROR]: 500,
};

/** Typed error thrown by auditor.js and caught by the route handler */
class AuditError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AuditError';
    this.code = code;
  }
}

/**
 * Builds the standard error response body.
 * @param {string} code  - One of ErrorCodes
 * @param {string} message - Human-readable explanation
 */
function buildErrorBody(code, message) {
  return { success: false, error: { code, message } };
}

module.exports = { AuditError, ErrorCodes, httpStatusForCode, buildErrorBody };
