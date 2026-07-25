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

// Serve the frontend from the /public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/audit', auditRouter);

// Fallback: serve index.html for any unmatched route (single-page app behaviour)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
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

app.listen(PORT, () => {
  console.log(`Page Pulse running on http://localhost:${PORT}`);
});

module.exports = app;
