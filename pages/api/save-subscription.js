import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { subscription, userType, userId } = req.body;

    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        subscription: subscription,
        user_type: userType,
        user_id: userId,
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;

    res.status(200).json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: error.message });
  }
}