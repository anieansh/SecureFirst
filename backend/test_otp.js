const { generateSecret, generate, verify } = require('otplib');
const secret = generateSecret();
const token = generate(secret);
const isValid = verify({ token, secret });
console.log('Secret:', secret, 'Token:', token, 'IsValid:', isValid);
