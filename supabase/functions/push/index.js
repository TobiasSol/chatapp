// supabase/functions/push/index.js
import { serve } from 'https://deno.land/std@0.168.0/http/server.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

serve(async (req) => {
  try {
    const payload = await req.json()
    
    // Angepasst an die Struktur, wie der Token in _app.js gespeichert wird
    const { data: tokenData } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('userType', 'admin')
      .single()

    if (!tokenData?.subscription) {
      return new Response(
        JSON.stringify({ error: 'Kein Push-Token für Admin gefunden' }),
        { status: 400 }
      )
    }

    // Sende die Nachricht an Expo
    const message = {
      to: tokenData.subscription,
      sound: 'default',
      title: 'Neue Nachricht von Gast',
      body: `${payload.record.guest_name}: ${payload.record.content}`,
      data: { 
        messageId: payload.record.id,
        guestName: payload.record.guest_name,
        type: 'new_message'
      }
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Authorization': `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`
      },
      body: JSON.stringify(message)
    })

    const result = await response.json()
    
    console.log('Push notification result:', result)
    
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error sending push notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})