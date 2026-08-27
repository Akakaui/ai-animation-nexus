const assert = require('assert');

process.env.NODE_ENV = 'test';
process.env.PAYMENT_MODE = '';
process.env.PAYMENT_WINDOW_START = '';
process.env.PAYMENT_AMOUNT_MAJOR = '2.99';
process.env.PAYMENT_AMOUNT_MINOR = '299';
process.env.PAYMENT_FREE_DAYS = '20';
process.env.PAYMENT_PAID_DAYS = '10';

const { getPaymentWindowStatus } = require('../lib/config');
const {
  saveStudent, getStudentByEmail, getStudentByEmailAny, generateUniqueAccessCode,
  parseUnlockTime, isUnlocked,
} = require('../lib/db');

function run() {
  let status = getPaymentWindowStatus(new Date('2026-01-01T00:00:00Z'));
  assert.equal(status.mode, 'free');
  assert.equal(status.config.amountMajor, 2.99);
  assert.equal(status.config.amountMinor, 299);

  process.env.PAYMENT_WINDOW_START = '2026-01-01T00:00:00Z';
  status = getPaymentWindowStatus(new Date('2026-01-10T00:00:00Z'));
  assert.equal(status.mode, 'free');
  status = getPaymentWindowStatus(new Date('2026-01-21T00:00:00Z'));
  assert.equal(status.mode, 'paid');
  status = getPaymentWindowStatus(new Date('2026-02-01T00:00:00Z'));
  assert.equal(status.mode, 'closed');

  const unlock = parseUnlockTime('2026-01-01T20:00:00Z');
  assert.equal(isUnlocked({ unlocks_at: '2026-01-01T20:00:00Z' }, new Date('2026-01-01T19:59:59Z')), false);
  assert.equal(isUnlocked({ unlocks_at: '2026-01-01T20:00:00Z' }, unlock), true);

  return Promise.all([
    generateUniqueAccessCode(),
    saveStudent({ full_name: 'Self Test', email: 'self-test@example.com', payment_status: 'free', paid: false, access_code: 'AN-SELF-TEST' }),
  ]).then(async ([code]) => {
    assert.match(code, /^AN-[A-F0-9]{6}-[A-F0-9]{4}$/);
    assert.ok(await getStudentByEmail('self-test@example.com'));
    assert.ok(await getStudentByEmailAny('self-test@example.com'));
    console.log('Self-tests passed.');
  });
}

run().catch(error => { console.error(error); process.exit(1); });
