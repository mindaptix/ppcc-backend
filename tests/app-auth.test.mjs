import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import crypto from 'node:crypto';

function setup({ configured = true, payload = { type: 'success', message: 'provider-request' }, rows = [1] } = {}) {
  const calls = [], queries = [];
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/lib/app-auth.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, process: { env: { MSG91_WIDGET_ID: 'widget', MSG91_WIDGET_TOKEN: 'secret', MSG91_WHATSAPP_ONLY: String(configured) } },
    require: (name) => {
      if (name === 'node:crypto') return crypto;
      if (name === './portal-data') return { punjabDistricts: [] };
      if (name === './db') return { db: () => ({ query: async (sql, values) => {
        queries.push({ sql, values });
        return { rowCount: rows.length ? rows.shift() : 1, rows: [] };
      } }) };
      return {};
    },
    AbortSignal, fetch: async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return { ok: true, json: async () => payload };
    },
  });
  return { auth: exports, calls, queries };
}

test('fails closed before sending when WhatsApp configuration is not confirmed', async () => {
  const { auth, calls } = setup({ configured: false });
  assert.equal((await auth.sendLoginOtp('9876543210')).ok, false);
  assert.equal(calls.length, 0);
});
test('initial send uses widget and binds provider request to mobile without SMS template', async () => {
  const { auth, calls, queries } = setup();
  assert.equal((await auth.sendLoginOtp('9876543210')).reqId, 'provider-request');
  assert.equal(calls[0].url, 'https://control.msg91.com/api/v5/widget/sendOtpMobile');
  assert.deepEqual(calls[0].body, { widgetId: 'widget', tokenAuth: 'secret', identifier: '919876543210' });
  assert.deepEqual(Array.from(queries[0].values), ['9876543210', 'provider-request']);
});
test('resend explicitly selects WhatsApp channel 12', async () => {
  const { auth, calls } = setup();
  assert.equal((await auth.sendLoginOtp('9876543210', 'provider-request')).reqId, 'provider-request');
  assert.equal(calls[0].body.retryChannel, '12');
  assert.ok(calls[0].url.endsWith('/retryOtp'));
});
test('expired, wrong-mobile or throttled request cannot resend or verify', async () => {
  for (const operation of ['send', 'verify']) {
    const { auth, calls } = setup({ rows: [0] });
    const result = operation === 'send'
      ? (await auth.sendLoginOtp('9876543210', 'wrong-request')).ok
      : await auth.verifyLoginOtp('9876543210', '1234', 'wrong-request');
    assert.equal(result, false);
    assert.equal(calls.length, 0);
  }
});
test('verification must consume challenge; replay cannot create a session', async () => {
  const { auth, queries } = setup({ rows: [1, 0] });
  assert.equal(await auth.verifyLoginOtp('9876543210', '1234', 'provider-request'), false);
  assert.match(queries[0].sql, /attempts < 5/);
  assert.match(queries[1].sql, /DELETE FROM member_otp_challenges/);
});
test('provider rejection does not consume the challenge', async () => {
  const { auth, queries } = setup({ payload: { type: 'error' } });
  assert.equal(await auth.verifyLoginOtp('9876543210', '1111', 'provider-request'), false);
  assert.equal(queries.length, 1);
});
test('valid verification consumes bound challenge', async () => {
  const { auth, calls } = setup({ rows: [1, 1] });
  assert.equal(await auth.verifyLoginOtp('9876543210', '1234', 'provider-request'), true);
  assert.equal(calls[0].body.reqId, 'provider-request');
});
test('send rate limit uses database atomic claim', async () => {
  const { auth, queries } = setup({ rows: [0] });
  assert.equal(await auth.tooManyOtpSends('9876543210'), true);
  assert.match(queries[0].sql, /ON CONFLICT/);
});
