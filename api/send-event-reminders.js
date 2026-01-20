import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type')

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    try {
        // 1. Get Environment Variables
        const RESEND_API_KEY = process.env.RESEND_API_KEY
        const SUPABASE_URL = process.env.VITE_SUPABASE_URL
        const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

        if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')
        if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL')
        if (!SUPABASE_ANON_KEY) throw new Error('Missing SUPABASE_ANON_KEY')

        // 2. Initialize Supabase Client
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

        // 3. Find Events with Reminders Due
        // Events starting in 24-48 hours that haven't had reminders sent
        const now = new Date()
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000)

        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .gte('start_date', twentyFourHoursFromNow.toISOString())
            .lte('start_date', fortyEightHoursFromNow.toISOString())
            .eq('is_published', true)

        if (eventsError) throw eventsError

        if (!events || events.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No events found requiring reminders',
                summary: []
            })
        }

        // 4. For Each Event, Find Approved Registrations
        const summary = []

        for (const event of events) {
            const { data: registrations, error: regError } = await supabase
                .from('registrations')
                .select('*')
                .eq('event_id', event.id)
                .eq('status', 'approved')

            if (regError || !registrations || registrations.length === 0) {
                continue
            }

            // 5. Send Reminder Email to Each Participant
            for (const reg of registrations) {
                const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                        .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .header h1 { color: #4f46e5; margin: 0; font-size: 28px; }
                        .content { margin: 20px 0; }
                        .event-details { background: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #4f46e5; margin: 20px 0; }
                        .event-details h2 { margin-top: 0; color: #000; font-size: 20px; }
                        .info-row { margin: 10px 0; }
                        .info-row strong { color: #64748b; }
                        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
                        .cta-button { display: inline-block; padding: 12px 30px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Event Reminder</h1>
                            <p>Your event is coming up soon!</p>
                        </div>
                        
                        <div class="content">
                            <p>Hi ${reg.team_leader_name},</p>
                            <p>This is a friendly reminder that you're registered for the following event:</p>
                            
                            <div class="event-details">
                                <h2>${event.title}</h2>
                                <div class="info-row">
                                    <strong>📅 Date:</strong> ${new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                <div class="info-row">
                                    <strong>🕐 Time:</strong> ${new Date(event.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div class="info-row">
                                    <strong>📍 Location:</strong> ${event.location || 'TBD'}
                                </div>
                                ${reg.is_team_registration ? `
                                <div class="info-row">
                                    <strong>👥 Team:</strong> ${reg.team_name}
                                </div>` : ''}
                            </div>
                            
                            <p><strong>Important:</strong> Please bring your ticket QR code (sent separately) for check-in at the venue.</p>
                            
                            <p>We're excited to see you there!</p>
                        </div>
                        
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} AI Verse. All rights reserved.</p>
                            <p>If you have any questions, please contact us at teams.aiverse@gmail.com</p>
                        </div>
                    </div>
                </body>
                </html>
                `

                // Send email via Resend
                const emailRes = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${RESEND_API_KEY}`,
                    },
                    body: JSON.stringify({
                        from: 'AI Verse <onboarding@resend.dev>',
                        reply_to: 'teams.aiverse@gmail.com',
                        to: reg.team_leader_email,
                        subject: `Reminder: ${event.title} is tomorrow!`,
                        html: htmlContent,
                    }),
                })

                if (emailRes.ok) {
                    summary.push({
                        event: event.title,
                        recipient: reg.team_leader_email,
                        status: 'sent'
                    })
                } else {
                    const errorData = await emailRes.text()
                    summary.push({
                        event: event.title,
                        recipient: reg.team_leader_email,
                        status: 'failed',
                        error: errorData
                    })
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: `Sent ${summary.filter(s => s.status === 'sent').length} reminders`,
            summary
        })

    } catch (error) {
        console.error('Error sending reminders:', error)
        return res.status(200).json({ success: false, error: error.message })
    }
}
