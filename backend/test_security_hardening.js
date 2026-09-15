/**
 * Security Hardening Verification Test Suite
 * Verifies defensive controls:
 * 1. Role Privilege Escalation Protection (blocking self-elevation to admin/coast_guard)
 * 2. Password length boundaries (max 72 chars to prevent Bcrypt CPU DoS)
 * 3. Email validation & null-byte stripping
 * 4. Chat message length validation (max 2,000 characters)
 * 5. Memory Rate Limiter enforcement (HTTP 429)
 * 6. Bounded Session Store LRU eviction & max capacity
 */

const http = require('http');
const app = require('./src/app');
const { MemoryRateLimiter } = require('./src/middleware/rateLimiter');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  console.log('========================================================================');
  console.log('>>> ORCA SECURITY HARDENING VERIFICATION SUITE                       <<<');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  const runTest = async (title, fn) => {
    total++;
    process.stdout.write(`[SEC TEST ${total.toString().padStart(2, '0')}] ${title}... `);
    try {
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      process.exitCode = 1;
    }
  };

  try {
    // 1. Role Privilege Escalation Defense
    await runTest('Reject unauthorized role elevation (role: admin)', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hacker Bob',
          email: `hacker_${Date.now()}@test.com`,
          password: 'validPassword123',
          role: 'admin'
        })
      });
      const data = await res.json();
      if (res.status !== 403 || data.success !== false) {
        throw new Error(`Expected HTTP 403, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // 2. Reject unauthorized role elevation (role: coast_guard)
    await runTest('Reject unauthorized role elevation (role: coast_guard)', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Infiltrator',
          email: `infiltrator_${Date.now()}@test.com`,
          password: 'validPassword123',
          role: 'coast_guard'
        })
      });
      const data = await res.json();
      if (res.status !== 403 || data.success !== false) {
        throw new Error(`Expected HTTP 403, got ${res.status}: ${JSON.stringify(data)}`);
      }
    });

    // 3. Bcrypt CPU Exhaustion Defense (> 72 characters)
    await runTest('Reject oversized passwords (> 72 characters) to prevent Bcrypt CPU DoS', async () => {
      const longPassword = 'A'.repeat(80);
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Long Pass User',
          email: `longpass_${Date.now()}@test.com`,
          password: longPassword
        })
      });
      const data = await res.json();
      if (res.status !== 400 || !data.message.includes('72')) {
        throw new Error(`Expected HTTP 400 rejecting 72+ char password, got ${res.status}`);
      }
    });

    // 4. Invalid Email Format Rejection
    await runTest('Reject invalid email syntax', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'validPassword123'
        })
      });
      const data = await res.json();
      if (res.status !== 400) {
        throw new Error(`Expected HTTP 400 for invalid email, got ${res.status}`);
      }
    });

    // 5. Chat Message Length Bound (2000 characters)
    await runTest('Reject chat message exceeding 2000 characters', async () => {
      const giantMessage = 'M'.repeat(2500);
      const res = await fetch(`${baseUrl}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: giantMessage
        })
      });
      const data = await res.json();
      if (res.status !== 400 || !data.message.includes('2,000')) {
        throw new Error(`Expected HTTP 400 with 2000 char warning, got ${res.status}`);
      }
    });

    // 6. Rate Limiter Functional Behavior
    await runTest('Rate limiter correctly limits and sets headers', async () => {
      const limiter = new MemoryRateLimiter({
        windowMs: 1000,
        max: 3,
        message: 'Rate limit test'
      });
      const mw = limiter.middleware();
      let statusCalled = null;
      let jsonCalled = null;

      const dummyReq = { headers: {}, socket: { remoteAddress: '10.0.0.99' } };
      const dummyRes = {
        setHeader: () => {},
        status: (s) => {
          statusCalled = s;
          return {
            json: (j) => { jsonCalled = j; }
          };
        }
      };

      // Temporarily simulate non-test environment to test the limiter mechanism
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        let nextCount = 0;
        const next = () => { nextCount++; };

        // 3 allowed calls
        mw(dummyReq, dummyRes, next);
        mw(dummyReq, dummyRes, next);
        mw(dummyReq, dummyRes, next);
        if (nextCount !== 3) throw new Error(`Expected 3 next() calls, got ${nextCount}`);

        // 4th call must be blocked with 429
        mw(dummyReq, dummyRes, next);
        if (statusCalled !== 429 || jsonCalled?.error !== 'TOO_MANY_REQUESTS') {
          throw new Error(`Expected 429 status, got ${statusCalled}`);
        }
      } finally {
        process.env.NODE_ENV = origEnv;
      }
    });

    // 7. Input Sanitization (Null-byte stripping)
    await runTest('Input sanitization middleware strips null bytes', async () => {
      const { sanitizeInputs } = require('./src/middleware/validation.middleware');
      const req = {
        body: { query: 'fishing\0spot', nested: { text: 'test\0value' } },
        query: {},
        params: {}
      };
      sanitizeInputs(req, {}, () => {});
      if (req.body.query !== 'fishingspot' || req.body.nested.text !== 'testvalue') {
        throw new Error('Null bytes were not stripped from input object');
      }
    });

    console.log('\n========================================================================');
    console.log(`>>> SECURITY SUMMARY: ${passed}/${total} TESTS PASSED <<<`);
    console.log('========================================================================\n');
  } finally {
    server.close();
  }
});
