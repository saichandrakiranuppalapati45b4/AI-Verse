
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Get Dependencies and Env Vars
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')
        if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL')
        if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

        // 2. Parse Registry ID from Body
        const { registration_id } = await req.json()
        if (!registration_id) throw new Error('Missing registration_id')

        // 3. Initialize Supabase Client (Service Role for Admin Access)
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // 4. Fetch Registration Details (Join with Events)
        const { data: registration, error: fetchError } = await supabase
            .from('registrations')
            .select('*, events(*)')
            .eq('id', registration_id)
            .single()

        if (fetchError || !registration) {
            throw new Error('Registration not found or fetch error: ' + (fetchError?.message || 'Unknown'))
        }

        const event = registration.events
        const recipientEmail = registration.team_leader_email
        const recipientName = registration.team_leader_name

        // 5. Generate QR Code URL
        const qrData = JSON.stringify({
            id: registration.id,
            event: event.title,
            name: recipientName,
            team: registration.team_name || 'Individual',
            type: registration.is_team_registration ? 'Team' : 'Individual'
        })

        // QR Server API (Public, reliable)
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`

        // 6. Construct HTML Email (Updated Design)
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                .container { max-width: 700px; margin: 20px auto; background: #fff; padding: 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #4f46e5; }
                .header h2 { margin: 0; color: #111; font-size: 24px; }
                .logo-text { font-weight: bold; color: #666; }
                .ticket-body { padding: 30px; display: flex; flex-wrap: wrap; gap: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; margin: 20px; border-radius: 8px; }
                .ticket-info { flex: 2; min-width: 300px; }
                .ticket-qr { flex: 1; min-width: 150px; display: flex; justify-content: center; align-items: center; }
                .event-title { font-size: 22px; font-weight: 800; color: #000; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
                .host-info { font-size: 14px; color: #666; margin-bottom: 20px; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 25px; }
                .detail-item strong { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; letter-spacing: 1px; }
                .detail-item span { font-size: 15px; font-weight: 600; color: #334155; }
                .qr-image { width: 100%; max-width: 200px; height: auto; border: 4px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #eee; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>This is your ticket</h2>
                    <span class="logo-text">AI VERSE</span>
                </div>
                
                <div class="ticket-body">
                    <div class="ticket-info">
                        <div class="host-info">AI Verse Events • ${event.location || 'Online / TBD'}</div>
                        <div class="event-title">${event.title}</div>
                        <div class="host-info">
                            ${new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
                            ${new Date(event.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        <div class="details-grid">
                            <div class="detail-item">
                                <strong>Issued To</strong>
                                <span>${recipientName}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Registration ID</strong>
                                <span style="font-family: monospace;">${registration.id.split('-')[0].toUpperCase()}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Ticket Type</strong>
                                <span>${registration.is_team_registration ? 'Team Entry' : 'General Admission'}</span>
                            </div>
                            ${registration.is_team_registration ? `
                            <div class="detail-item">
                                <strong>Team Name</strong>
                                <span>${registration.team_name}</span>
                            </div>` : ''}
                        </div>
                    </div>
                    
                    <div class="ticket-qr">
                        <img src="${qrCodeUrl}" alt="Ticket QR Code" class="qr-image" />
                    </div>
                </div>

                <div class="footer">
                    <p>Please present this QR code at the event entrance for scanning.</p>
                    <p>&copy; ${new Date().getFullYear()} AI Verse. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `

        // 7. Send Email via Resend Fetch API (No sdk needed)
        const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'AI Verse <onboarding@resend.dev>',
                reply_to: 'teams.aiverse@gmail.com',
                to: recipientEmail,
                subject: `Your Ticket: ${event.title}`,
                html: htmlContent,
            }),
        })

        if (!emailRes.ok) {
            const errorData = await emailRes.text()
            throw new Error(`Resend API Error: ${emailRes.status} ${errorData}`)
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 even on error so client can read JSON message
        })
    }
})
