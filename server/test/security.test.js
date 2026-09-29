import test from 'node:test'; import assert from 'node:assert/strict';
import {checkEnv} from '../src/config/env.js'; import {passwordProblem} from '../src/utils/password.js';
const good = {DATABASE_HOST: 'h', DATABASE_USER: 'u', DATABASE_NAME: 'd', CLIENT_URL: 'http://x', JWT_SECRET: 'a'.repeat(40)};
test('accepts a complete env', () => assert.deepEqual(checkEnv(good), []));
test('rejects short or placeholder JWT secret', () => {
  assert.equal(checkEnv({...good, JWT_SECRET: 'short'}).length, 1);
  assert.equal(checkEnv({...good, JWT_SECRET: 'replace_with_a_long_random_string'}).length, 1);
});
test('requires DB password in production', () => assert.equal(checkEnv({...good, NODE_ENV: 'production'}).length, 2));
test('reports missing variables', () => assert.ok(checkEnv({}).length >= 5));
test('password policy', () => {
  assert.ok(passwordProblem('short1')); assert.ok(passwordProblem('onlyletterslong')); assert.ok(passwordProblem('1234567890123'));
  assert.equal(passwordProblem('goodpass1234'), null); assert.ok(passwordProblem('a1'.repeat(40)));
});
