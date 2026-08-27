require('dotenv').config();

const DEFAULT_PAYMENT_AMOUNT_MAJOR = 2.99;
const DEFAULT_PAYMENT_AMOUNT_MINOR = 299;
const DEFAULT_PAYMENT_CURRENCY = 'USD';
const DEFAULT_FREE_DAYS = 20;
const DEFAULT_PAID_DAYS = 10;

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getPaymentConfig() {
  const explicitMode = String(process.env.PAYMENT_MODE || '').trim().toLowerCase();
  const amountMajor = Number(process.env.PAYMENT_AMOUNT_MAJOR || DEFAULT_PAYMENT_AMOUNT_MAJOR);
  const amountMinor = Number(process.env.PAYMENT_AMOUNT_MINOR || DEFAULT_PAYMENT_AMOUNT_MINOR);
  const freeDays = Number(process.env.PAYMENT_FREE_DAYS || DEFAULT_FREE_DAYS);
  const paidDays = Number(process.env.PAYMENT_PAID_DAYS || DEFAULT_PAID_DAYS);
  const windowStart = parseDate(process.env.PAYMENT_WINDOW_START);
  const safeAmountMajor = Number.isFinite(amountMajor) && amountMajor > 0 ? amountMajor : DEFAULT_PAYMENT_AMOUNT_MAJOR;
  const safeAmountMinor = Number.isInteger(amountMinor) && amountMinor > 0 ? amountMinor : DEFAULT_PAYMENT_AMOUNT_MINOR;
  const safeFreeDays = Number.isFinite(freeDays) && freeDays >= 0 ? freeDays : DEFAULT_FREE_DAYS;
  const safePaidDays = Number.isFinite(paidDays) && paidDays > 0 ? paidDays : DEFAULT_PAID_DAYS;

  return {
    mode: explicitMode || null,
    amountMajor: safeAmountMajor,
    amountMinor: safeAmountMinor,
    currency: process.env.PAYMENT_CURRENCY || DEFAULT_PAYMENT_CURRENCY,
    freeDays: safeFreeDays,
    paidDays: safePaidDays,
    windowStart,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  };
}

function getPaymentWindowStatus(now = new Date()) {
  const config = getPaymentConfig();

  if (config.mode === 'free' || config.mode === 'paused') {
    return { mode: 'free', isFree: true, isPaid: false, isClosed: false, config };
  }
  if (config.mode === 'paid' || config.mode === 'open') {
    return { mode: 'paid', isFree: false, isPaid: true, isClosed: false, config };
  }
  if (config.mode === 'closed') {
    return { mode: 'closed', isFree: false, isPaid: false, isClosed: true, config };
  }

  if (!config.windowStart) {
    // Payment stays paused until the owner explicitly configures the window.
    return { mode: 'free', isFree: true, isPaid: false, isClosed: false, config };
  }

  const freeEnd = new Date(config.windowStart.getTime() + config.freeDays * 86400000);
  const paidEnd = new Date(freeEnd.getTime() + config.paidDays * 86400000);
  if (now < freeEnd) {
    return { mode: 'free', isFree: true, isPaid: false, isClosed: false, startsAt: config.windowStart, endsAt: freeEnd, config };
  }
  if (now < paidEnd) {
    return { mode: 'paid', isFree: false, isPaid: true, isClosed: false, startsAt: freeEnd, endsAt: paidEnd, config };
  }
  return { mode: 'closed', isFree: false, isPaid: false, isClosed: true, startsAt: config.windowStart, endsAt: paidEnd, config };
}

function getPublicRuntimeConfig() {
  const payment = getPaymentWindowStatus();
  return {
    paymentMode: payment.mode,
    paymentAmountMajor: payment.config.amountMajor,
    paymentAmountMinor: payment.config.amountMinor,
    paymentCurrency: payment.config.currency,
    paystackPublicKey: payment.config.publicKey,
    paymentWindowStart: payment.config.windowStart ? payment.config.windowStart.toISOString() : null,
    paymentFreeDays: payment.config.freeDays,
    paymentPaidDays: payment.config.paidDays,
    baseUrl: process.env.BASE_URL || '',
  };
}

function requireProductionConfig() {
  const required = ['ADMIN_PASSWORD', 'PAYSTACK_SECRET_KEY', 'RESEND_API_KEY', 'EMAIL_FROM', 'BASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  if (process.env.NODE_ENV === 'production' && missing.length) {
    throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
  }
}

module.exports = { getPaymentConfig, getPaymentWindowStatus, getPublicRuntimeConfig, requireProductionConfig };
