/**
 * api/audit.js — Vercel Serverless Function
 *
 * Vercel automatically detects any file inside /api/ as a serverless endpoint.
 * This file handles POST /api/audit and reuses the same core logic from server/.
 * Local dev and Railway still use server/index.js (Express) — this is Vercel-only.
 */

const { validateUrl } = require('../server/utils/validate');
const { auditUrl }    = require('../server/services/auditor');
const {
  AuditError,
  ErrorCodes,
  httpStatusForCode,
  buildErrorBody,
} = require('../server/utils/errors');

module.exports = async (req, res) => {
  // Allow only POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST requests are accepted.' },
    });
  }

  const { url } = req.body || {};

  // Validate before hitting the network
  const validation = validateUrl(url);
  if (!validation.valid) {
    return res
      .status(400)
      .json(buildErrorBody(ErrorCodes.INVALID_URL, validation.reason));
  }

  try {
    const report = await auditUrl(url.trim());
    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    if (err instanceof AuditError) {
      const httpStatus = httpStatusForCode[err.code] ?? 500;
      return res.status(httpStatus).json(buildErrorBody(err.code, err.message));
    }
    console.error('[api/audit] Unexpected error:', err);
    return res
      .status(500)
      .json(buildErrorBody(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred.'));
  }
};
