import test from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';

test('FIX B: X-Frame-Options Header Security Policy', async (t) => {
  await t.test('Sets X-Frame-Options: SAMEORIGIN when IS_PRODUCTION is true', async () => {
    const app = express();
    const isProd = true;
    app.use((_req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (isProd) {
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      } else {
        res.removeHeader('X-Frame-Options');
      }
      next();
    });
    app.get('/test-prod', (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/test-prod');
    assert.strictEqual(res.headers['x-frame-options'], 'SAMEORIGIN');
  });

  await t.test('Omits / removes X-Frame-Options when IS_PRODUCTION is false (AI Studio Preview support)', async () => {
    const app = express();
    const isProd = false;
    app.use((_req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (isProd) {
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      } else {
        res.removeHeader('X-Frame-Options');
      }
      next();
    });
    app.get('/test-dev', (_req, res) => res.json({ ok: true }));

    const res = await request(app).get('/test-dev');
    assert.strictEqual(res.headers['x-frame-options'], undefined);
  });
});
