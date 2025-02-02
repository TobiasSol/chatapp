// scripts/generate-vapid-keys.js
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('=======================================');
console.log('VAPID Keys generated:');
console.log('=======================================');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('=======================================');