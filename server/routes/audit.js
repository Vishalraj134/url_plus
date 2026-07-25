/**
 * audit.js  (route handler)
 * POST /api/audit
 *
 * Thin layer: validate → audit → respond.
 * All business logic lives in services/auditor.js and utils/.
 */

const express = require('express');
const { validateUrl } = require('../utils/validate');
const { auditUrl } = require('../services/auditor');
const { AuditError, ErrorCodes, httpStatusForCode, buildErrorBody } = require('../utils/errors');

const router = express.Router();

router.post('/', async (req, res) => {
  const { url } = req.body || {};

  // 1. Validate input before touching the network
  const validation = validateUrl(url);
  if (!validation.valid) {
    return res
      .status(400)
      .json(buildErrorBody(ErrorCodes.INVALID_URL, validation.reason));
  }

  // 2. Run the audit
  try {
    const report = await auditUrl(url.trim());
    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    if (err instanceof AuditError) {
      // Known, typed failure — return specific error shape
      const httpStatus = httpStatusForCode[err.code] ?? 500;
      return res.status(httpStatus).json(buildErrorBody(err.code, err.message));
    }

    // Unexpected failure — log server-side, return generic message
    console.error('[audit route] Unexpected error:', err);
    return res
      .status(500)
      .json(
        buildErrorBody(
          ErrorCodes.INTERNAL_ERROR,
          'An unexpected error occurred. Please try again.'
        )
      );
  }
});

module.exports = router;
