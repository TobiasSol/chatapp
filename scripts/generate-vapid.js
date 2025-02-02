// scripts/generate-vapid.js
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log(vapidKeys);