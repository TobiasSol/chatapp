// pages/api/send-push.js
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your@email.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  const { subscription, message } = req.body;
  
  try {
    await webpush.sendNotification(subscription, message);
    res.status(200).json({success: true});
  } catch (err) {
    res.status(500).json({error: err.message});
  }
}