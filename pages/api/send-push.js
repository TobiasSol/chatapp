import webpush from 'web-push';

const vapidDetails = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: 'mailto:tobias.solski@gmail.com'
};

webpush.setVapidDetails(
  vapidDetails.subject,
  vapidDetails.publicKey,
  vapidDetails.privateKey
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { subscription, message } = req.body;
    
    await webpush.sendNotification(subscription, JSON.stringify({
      message: message
    }));
    
    res.status(200).json({success: true});
  } catch (err) {
    console.error('Error sending push:', err);
    res.status(500).json({error: err.message});
  }
}