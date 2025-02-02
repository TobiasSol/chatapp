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
    
    // Hole den Push-Token für den Empfänger
    const { data: tokenData } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', payload.record.recipient_id)
      .single()

    if (!tokenData?.token) {
      return new Response(
        JSON.stringify({ error: 'Kein Push-Token gefunden' }),
        { status: 400 }
      )
    }

    // Sende die Nachricht an Expo
    const message = {
      to: tokenData.token,
      sound: 'default',
      title: 'Neue Nachricht',
      body: payload.record.content,
      data: { messageId: payload.record.id }
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
    
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})