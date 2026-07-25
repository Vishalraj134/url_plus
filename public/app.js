/**
 * app.js — Page Pulse frontend
 * Handles: form submission, loading state, result rendering, error display.
 */

// ─── DOM References ──────────────────────────────────────────────────────────
const form           = document.getElementById('audit-form');
const urlInput       = document.getElementById('url-input');
const submitBtn      = document.getElementById('submit-btn');
const loadingState   = document.getElementById('loading-state');
const loadingUrlDisplay = document.getElementById('loading-url-display');
const errorState     = document.getElementById('error-state');
const errorMessage   = document.getElementById('error-message');
const errorCode      = document.getElementById('error-code');
const resultsSection = document.getElementById('results-section');

// Metric value elements
const els = {
  url:       document.getElementById('result-url'),
  auditedAt: document.getElementById('result-audited-at'),
  httpStatus:  document.getElementById('m-http-status'),
  responseTime: document.getElementById('m-response-time'),
  pageTitle:   document.getElementById('m-page-title'),
  metaDesc:    document.getElementById('m-meta-desc'),
  h1Count:     document.getElementById('m-h1-count'),
  imgAlt:      document.getElementById('m-img-alt'),
  wordCount:   document.getElementById('m-word-count'),
};

// ─── State ───────────────────────────────────────────────────────────────────
/** Prevent double-submit while a request is in flight */
let isLoading = false;

// ─── Event Listeners ─────────────────────────────────────────────────────────
form.addEventListener('submit', handleSubmit);

// ─── Handlers ────────────────────────────────────────────────────────────────
async function handleSubmit(e) {
  e.preventDefault();
  if (isLoading) return;

  const url = urlInput.value.trim();

  // Client-side quick check before hitting the server
  if (!url) {
    showError('Please enter a URL before running the audit.', '');
    return;
  }

  setLoading(true, url);

  try {
    const response = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const json = await response.json();

    if (json.success) {
      showResults(json.data);
    } else {
      showError(json.error.message, json.error.code);
    }
  } catch (err) {
    // Network error — server unreachable (e.g. offline)
    showError(
      'Could not reach the Page Pulse server. Check your internet connection and try again.',
      'NETWORK_ERROR'
    );
  } finally {
    setLoading(false);
  }
}

// ─── UI State Helpers ─────────────────────────────────────────────────────────

/** Show/hide the loading state and disable the form while fetching */
function setLoading(loading, url = '') {
  isLoading = loading;
  submitBtn.disabled = loading;
  submitBtn.querySelector('.btn-label').textContent = loading ? 'Auditing…' : 'Audit';

  setVisible(loadingState, loading);
  setVisible(errorState, false);
  setVisible(resultsSection, false);

  if (loading) {
    loadingUrlDisplay.textContent = url;
  }
}

/** Display a human-readable error */
function showError(message, code) {
  errorMessage.textContent = message;
  errorCode.textContent = code ? `Error code: ${code}` : '';
  setVisible(errorState, true);
  setVisible(resultsSection, false);
  errorState.classList.remove('fade-in');
  void errorState.offsetWidth; // trigger reflow for re-animation
  errorState.classList.add('fade-in');
}

/** Populate and reveal the results section */
function showResults(data) {
  // Header row
  els.url.textContent = data.url;
  els.url.href = data.url;
  els.auditedAt.textContent = formatDateTime(data.auditedAt);

  // HTTP Status — colour-coded
  els.httpStatus.textContent = data.httpStatus;
  els.httpStatus.className = 'metric-value ' + httpStatusClass(data.httpStatus);

  // Response time
  els.responseTime.textContent = `${data.responseTimeMs.toLocaleString()} ms`;
  els.responseTime.className = 'metric-value ' + responseTimeClass(data.responseTimeMs);

  // Text fields — show "—" if null/empty
  els.pageTitle.textContent  = data.pageTitle       || '— not found —';
  els.metaDesc.textContent   = data.metaDescription || '— not found —';

  // H1 count — flag if zero or more than one
  els.h1Count.textContent  = data.h1Count;
  els.h1Count.className    = 'metric-value ' + h1Class(data.h1Count);

  // Images missing alt — flag if any
  els.imgAlt.textContent   = data.imagesMissingAlt;
  els.imgAlt.className     = 'metric-value ' + (data.imagesMissingAlt > 0 ? 'status--warn' : 'status--ok');

  // Word count
  els.wordCount.textContent = data.approximateWordCount.toLocaleString();

  setVisible(resultsSection, true);
  resultsSection.classList.remove('fade-in');
  void resultsSection.offsetWidth;
  resultsSection.classList.add('fade-in');
}

// ─── Formatting & Classification ─────────────────────────────────────────────

/** Toggle element visibility using the `hidden` attribute */
function setVisible(el, visible) {
  el.hidden = !visible;
}

/** ISO timestamp → readable local date-time string */
function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** CSS class for HTTP status code */
function httpStatusClass(status) {
  if (status >= 200 && status < 300) return 'status--ok';
  if (status >= 300 && status < 400) return 'status--warn';
  return 'status--error';
}

/** CSS class for response time (thresholds: <1s ok, <3s warn, else error) */
function responseTimeClass(ms) {
  if (ms < 1000) return 'status--ok';
  if (ms < 3000) return 'status--warn';
  return 'status--error';
}

/** CSS class for H1 count (exactly 1 is ideal for SEO) */
function h1Class(count) {
  if (count === 1) return 'status--ok';
  if (count === 0) return 'status--error';
  return 'status--warn'; // multiple H1s is a minor SEO issue
}
