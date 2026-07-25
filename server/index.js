/**
 * index.js — Express application entry point
 * Serves the static frontend from /public and mounts API routes.
 */

const express = require('express');
const path = require('path');
const auditRouter = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse incoming JSON bodies
app.use(express.json());

// Resolve absolute path to the public directory — works in both local and Vercel environments
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

// Serve the frontend static files (HTML, CSS, JS)
app.use(express.static(PUBLIC_DIR));

// API routes
app.use('/api/audit', auditRouter);

// Fallback: serve index.html for any unmatched route (single-page app behaviour)
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Global error handler — ensures no unhandled exception leaks a stack trace
app.use((err, req, res, _next) => {
  console.error('[global error handler]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected server error occurred.',
    },
  });
});

// Only start the HTTP server when run directly (e.g. `node server/index.js` or Railway).
// When imported as a module (e.g. by Vercel serverless), skip listen() — Vercel handles it.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Page Pulse running on http://localhost:${PORT}`);
  });
}

module.exports = app;
