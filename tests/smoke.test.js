/**
 * Smoke Test — 12min-timer
 *
 * Supertest-based: hits the Express app in-process (no real port bound,
 * no Chromium needed). Plus filesystem checks for static-asset bugs that
 * would silently break Caddy routing or look like scaffolding ship.
 *
 * Why not Puppeteer: the dev VM template doesn't ship Chromium, and the
 * real-browser checks we lost (console errors, network 404s) are
 * already covered by the asset-shape filesystem tests below — see Phase 2
 * retest report 2026-04-28 for full context.
 */
const request = require('supertest');
const fs = require('fs');
const path = require('path');

process.env.PORT = '3187';
const app = require('../server');

describe('12min-timer — Smoke Test', () => {
  describe('HTTP', () => {
    test('GET / returns 200 with HTML body', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text.length).toBeGreaterThan(0);
    });

    test('GET /api/health returns ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    test('static assets resolve (favicon.svg, app.js, index.html)', async () => {
      for (const asset of ['/favicon.svg', '/app.js', '/index.html']) {
        const res = await request(app).get(asset);
        // 200 or 304 (not modified) both pass — anything 4xx fails the smoke.
        expect(res.status).toBeLessThan(400);
      }
    });

    test('unknown /api/* returns 404', async () => {
      const res = await request(app).get('/api/unknown-endpoint');
      expect(res.status).toBe(404);
    });
  });

  describe('Static asset shape', () => {
    test('no absolute /api/ paths in client JS (breaks Caddy routing)', () => {
      // Phase 4 retest 2026-04-29: the previous version of this check
      // gated on `/api/` AND (`fetch` OR `API`) — which missed the
      // common pattern of using a wrapper named `api(...)` that internally
      // calls `fetch`. e.g. `colonies = await api('/api/colonies')` has
      // `/api/` but no `fetch` or `API`, so it slipped past and shipped
      // a fully-broken frontend that 404'd on every call.
      //
      // The right check: any non-comment line in client JS or HTML
      // containing the literal `'/api/` or `"/api/` (a quoted absolute
      // URL) is a violation, period. The wrapper name is irrelevant.
      const dir = path.join(__dirname, '..', 'public');
      const violations = [];
      const QUOTED_ABS_API = /(['"`])\/api\//;
      // Skip HTML comments (the scaffold ships docstring examples like
      //   <!-- e.g. fetch('/api/foo') -->
      // which are documentation, not violations). We strip <!-- … -->
      // blocks from HTML before scanning. JS files use the existing
      // line-prefix skip for // and /* */.
      function stripHtmlComments(src) {
        return src.replace(/<!--[\s\S]*?-->/g, '');
      }
      fs.readdirSync(dir)
        .filter(f => f.endsWith('.html') || f.endsWith('.js'))
        .forEach(file => {
          let body = fs.readFileSync(path.join(dir, file), 'utf8');
          if (file.endsWith('.html')) body = stripHtmlComments(body);
          body.split('\n').forEach((line, i) => {
            const stripped = line.trim();
            if (stripped.startsWith('//') || stripped.startsWith('*') || stripped.startsWith('/*')) return;
            if (QUOTED_ABS_API.test(line)) {
              violations.push(`${file}:${i + 1} ${stripped.substring(0, 100)}`);
            }
          });
        });
      if (violations.length) console.error('Absolute /api/ paths in client code (use relative `api/...` instead — the page has <base href="/apps/12min-timer/"> so leading slash escapes the namespace):\n  ' + violations.join('\n  '));
      expect(violations).toEqual([]);
    });

    // NOTE: this test file is part of the scaffold itself. We
    // INTENTIONALLY don't assert on "app.js has >50 lines of code" or
    // "index.html doesn't contain the placeholder copy" — those are
    // tautologies that fail against the scaffold as-shipped and only
    // pass once the agent has filled it in. The smoke tests that matter
    // (server boot, route shape, no absolute /api/ paths) run before
    // and after the agent's work, so they catch real regressions.
    // See docs/36-bundles-qa-report-2026-05-20.md CRITICAL-1.
  });
});
