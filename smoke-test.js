/**
 * smoke-test.js
 * Quick programmatic verification of the audit endpoint.
 * Run with: node smoke-test.js
 */

const http = require('http');

function post(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      { hostname: 'localhost', port: 3000, path: '/api/audit', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('\n── Page Pulse Smoke Tests ──\n');

  // Test 1: Valid URL
  try {
    console.log('Test 1: Valid URL (https://example.com)');
    const r = await post({ url: 'https://example.com' });
    console.log('  HTTP:', r.status);
    console.log('  success:', r.body.success);
    if (r.body.success) {
      const d = r.body.data;
      console.log('  pageTitle:', d.pageTitle);
      console.log('  httpStatus:', d.httpStatus);
      console.log('  responseTimeMs:', d.responseTimeMs);
      console.log('  h1Count:', d.h1Count);
      console.log('  imagesMissingAlt:', d.imagesMissingAlt);
      console.log('  approximateWordCount:', d.approximateWordCount);
      console.log('  PASS ✓');
    } else {
      console.log('  FAIL ✗ —', r.body.error);
    }
  } catch (e) { console.log('  FAIL ✗ — request error:', e.message); }

  // Test 2: Missing URL
  try {
    console.log('\nTest 2: Missing URL');
    const r = await post({});
    const pass = r.status === 400 && r.body.error?.code === 'INVALID_URL';
    console.log('  HTTP:', r.status, '| code:', r.body.error?.code, pass ? '| PASS ✓' : '| FAIL ✗');
  } catch (e) { console.log('  FAIL ✗ —', e.message); }

  // Test 3: Malformed URL
  try {
    console.log('\nTest 3: Malformed URL (not-a-url)');
    const r = await post({ url: 'not-a-url' });
    const pass = r.status === 400 && r.body.error?.code === 'INVALID_URL';
    console.log('  HTTP:', r.status, '| code:', r.body.error?.code, pass ? '| PASS ✓' : '| FAIL ✗');
  } catch (e) { console.log('  FAIL ✗ —', e.message); }

  // Test 4: Non-http protocol
  try {
    console.log('\nTest 4: Non-http protocol (ftp://example.com)');
    const r = await post({ url: 'ftp://example.com' });
    const pass = r.status === 400 && r.body.error?.code === 'INVALID_URL';
    console.log('  HTTP:', r.status, '| code:', r.body.error?.code, pass ? '| PASS ✓' : '| FAIL ✗');
  } catch (e) { console.log('  FAIL ✗ —', e.message); }

  // Test 5: Unreachable domain
  try {
    console.log('\nTest 5: Unreachable domain (https://this-domain-does-not-exist-xyz.com)');
    const r = await post({ url: 'https://this-domain-does-not-exist-xyz.com' });
    const pass = [502, 504].includes(r.status);
    console.log('  HTTP:', r.status, '| code:', r.body.error?.code, pass ? '| PASS ✓' : '| FAIL ✗');
  } catch (e) { console.log('  FAIL ✗ —', e.message); }

  console.log('\n── Done ──\n');
}

run();
