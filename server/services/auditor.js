/**
 * auditor.js
 * Core service: fetches a URL and extracts the 7 audit metrics.
 * Throws AuditError for all known failure modes so the route handler
 * never needs to know fetch/parse details.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { AuditError, ErrorCodes } = require('../utils/errors');

/** Maximum time (ms) to wait for the target page to respond */
const FETCH_TIMEOUT_MS = 9000;

/**
 * Fetches the URL and returns a parsed audit report.
 *
 * @param {string} url - A validated, well-formed http(s) URL
 * @returns {Promise<AuditReport>}
 * @throws {AuditError}
 */
async function auditUrl(url) {
  const startTime = Date.now();
  let response;

  try {
    response = await axios.get(url, {
      timeout: FETCH_TIMEOUT_MS,
      // Accept any status so we can report it rather than throw on 4xx/5xx
      validateStatus: () => true,
      // Limit download to 5 MB to avoid memory issues on huge pages
      maxContentLength: 5 * 1024 * 1024,
      headers: {
        // Identify ourselves clearly; some servers block empty user-agents
        'User-Agent': 'PagePulse-Auditor/1.0 (+https://github.com/page-pulse)',
      },
    });
  } catch (err) {
    // Map axios error types to our typed errors
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      throw new AuditError(
        ErrorCodes.TIMEOUT,
        `The target page did not respond within ${FETCH_TIMEOUT_MS / 1000} seconds.`
      );
    }
    if (
      err.code === 'ENOTFOUND' ||
      err.code === 'ECONNREFUSED' ||
      err.code === 'EAI_AGAIN' ||
      err.code === 'ECONNRESET'
    ) {
      throw new AuditError(
        ErrorCodes.UNREACHABLE,
        `Could not reach "${url}". Check that the domain exists and is reachable (${err.code}).`
      );
    }
    throw new AuditError(
      ErrorCodes.FETCH_ERROR,
      `Network error while fetching the page: ${err.message}`
    );
  }

  const responseTimeMs = Date.now() - startTime;

  // Verify the response is actually HTML before trying to parse it
  const contentType = response.headers['content-type'] || '';
  if (!contentType.includes('text/html')) {
    throw new AuditError(
      ErrorCodes.NOT_HTML,
      `The URL did not return an HTML page (Content-Type: "${contentType}"). ` +
        `Page Pulse can only audit HTML pages.`
    );
  }

  const report = parseHtml(response.data, {
    url,
    httpStatus: response.status,
    responseTimeMs,
  });

  return report;
}

/**
 * Parses the HTML body with cheerio and extracts all 7 audit fields.
 *
 * @param {string} html       - Raw HTML string
 * @param {object} meta       - Pre-computed fields (url, httpStatus, responseTimeMs)
 * @returns {AuditReport}
 */
function parseHtml(html, { url, httpStatus, responseTimeMs }) {
  const $ = cheerio.load(html);

  const pageTitle = $('title').first().text().trim() || null;

  const metaDescEl = $('meta[name="description"]').first();
  const metaDescription = metaDescEl.length
    ? metaDescEl.attr('content')?.trim() || null
    : null;

  const h1Count = $('h1').length;

  // Count images where alt is absent OR is an empty/whitespace-only string
  let imagesMissingAlt = 0;
  $('img').each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined || alt.trim() === '') {
      imagesMissingAlt++;
    }
  });

  const approximateWordCount = countWords($);

  return {
    url,
    auditedAt: new Date().toISOString(),
    httpStatus,
    responseTimeMs,
    pageTitle,
    metaDescription,
    h1Count,
    imagesMissingAlt,
    approximateWordCount,
  };
}

/**
 * Estimates visible word count by stripping script/style/noscript nodes
 * and splitting the remaining text on whitespace.
 *
 * @param {CheerioAPI} $ - Loaded cheerio instance
 * @returns {number}
 */
function countWords($) {
  // Remove non-visible elements so we only count user-facing text
  $('script, style, noscript, head').remove();

  const text = $('body').text();
  // Collapse whitespace and split on word boundaries
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/**
 * @typedef {Object} AuditReport
 * @property {string}      url
 * @property {string}      auditedAt         - ISO 8601 timestamp
 * @property {number}      httpStatus
 * @property {number}      responseTimeMs
 * @property {string|null} pageTitle
 * @property {string|null} metaDescription
 * @property {number}      h1Count
 * @property {number}      imagesMissingAlt
 * @property {number}      approximateWordCount
 */

module.exports = { auditUrl };
