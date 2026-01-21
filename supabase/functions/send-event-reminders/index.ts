import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Get Dependencies and Env Vars
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
        if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
        if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

        // 2. Initialize Supabase Client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 3. Find Upcoming Approved Events (Next 48 Hours)
        const now = new Date();
        const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const { data: events, error: eventError } = await supabase
            .from("events")
            .select("*")
            .gte("start_date", now.toISOString())
            .lte("start_date", next48Hours.toISOString())
            .eq("is_published", true);

        if (eventError) throw new Error("Error fetching events: " + eventError.message);

        if (!events || events.length === 0) {
            return new Response(JSON.stringify({ success: true, message: "No upcoming events found in the next 48 hours." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const summary = [];

        // 4. Iterate Events and Participants
        for (const event of events) {
            // Fetch Approved Registrations
            const { data: registrations, error: regError } = await supabase
                .from("registrations")
                .select("*")
                .eq("event_id", event.id)
                .eq("registration_status", "approved");

            if (regError) {
                console.error(`Error fetching registrations for event ${event.id}:`, regError);
                continue;
            }

            if (!registrations || registrations.length === 0) continue;

            for (const reg of registrations) {
                try {
                    // Send Email
                    const emailRes = await fetch("https://api.resend.com/emails", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${RESEND_API_KEY}`,
                        },
                        body: JSON.stringify({
                            from: "AI Verse <onboarding@resend.dev>",
                            reply_to: "teams.aiverse@gmail.com",
                            to: reg.team_leader_email,
                            subject: `Reminder: Upcoming Event - ${event.title}`,
                            html: `
                                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2>Reminder: ${event.title} is coming up!</h2>
                                    <p>Hi ${reg.team_leader_name},</p>
                                    <p>This is a reminder that you are registered for <strong>${event.title}</strong>.</p>
                                    
                                    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                                        <p style="margin: 0 0 8px;"><strong>Date:</strong> ${new Date(event.start_date).toLocaleString()}</p>
                                        <p style="margin: 0;"><strong>Location:</strong> ${event.location || 'Online / TBD'}</p>
                                    </div>
                                    
                                    <p>Please make sure to have your ticket ready for check-in.</p>
                                    <p>See you there!</p>
                                    <p>The AI Verse Team</p>
                                </div>
                            `,
                        }),
                    });

                    if (!emailRes.ok) {
                        const errorText = await emailRes.text();
                        console.error(`Failed to email ${reg.team_leader_email}: ${errorText}`);
                        summary.push({ email: reg.team_leader_email, status: 'failed', error: errorText });
                    } else {
                        summary.push({ email: reg.team_leader_email, status: 'sent', event: event.title });
                    }

                } catch (emailError) {
                    console.error(`Error sending to ${reg.team_leader_email}:`, emailError);
                    summary.push({ email: reg.team_leader_email, status: 'failed', error: emailError.message });
                }
            }
        }

        return new Response(JSON.stringify({ success: true, summary }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    }
});
