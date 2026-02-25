module.exports = {
  secret: process.env.JWT_SECRET || 'commerce_secret_m1p13_2026',
  expire: process.env.JWT_EXPIRE || '1h'
};