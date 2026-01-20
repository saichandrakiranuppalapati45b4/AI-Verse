# Vercel Deployment Configuration

## Environment Variables Required

You need to set the following environment variables in your Vercel project dashboard:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `RESEND_API_KEY` | Your Resend API key for sending emails | `re_xxxxxxxxxxxxx` |
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Steps to Add Environment Variables in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `ai-verse` project
3. Click **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: `RESEND_API_KEY`
   - **Value**: Your Resend API key
   - **Environments**: Select all (Production, Preview, Development)
   - Click **Save**
5. Repeat for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Getting Your Resend API Key:

1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to **API Keys**
3. Create a new API key or copy existing one
4. Paste it into Vercel's `RESEND_API_KEY` environment variable

### Getting Supabase Credentials:

Your `.env.example` already shows your Supabase URL and key:
```
VITE_SUPABASE_URL=https://fosvlrbwxqbdbydnouha.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_nae5XUV8j_0faK__J2-m8g_TaQ9rclZ
```

Use these same values in Vercel.

## Vercel Functions Configuration

Your Vercel Functions are located in the `api/` directory:
- `api/send-event-ticket.js`
- `api/send-event-reminders.js`

These will be automatically deployed as serverless functions when you deploy to Vercel.

## Deployment Steps

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Migrate email functions to Vercel"
   git push
   ```

2. **Vercel will auto-deploy** (if you have GitHub integration)
   - Or manually deploy: `vercel --prod`

3. **Verify Environment Variables** are set in Vercel Dashboard

4. **Test the functions:**
   - Navigate to your admin panel
   - Try sending a test ticket or reminder
   - Check if emails are delivered

## Testing Locally (Optional)

If you want to test locally before deploying:

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev
```

Then visit `http://localhost:3000` to test your app with Vercel Functions running locally.

## Troubleshooting

### "Missing RESEND_API_KEY" Error
- Ensure the environment variable is set in Vercel Dashboard
- Re-deploy after adding environment variables

### Email Not Sending
- Check Resend Dashboard for delivery status
- Verify API key is valid
- Check Vercel Function logs in Vercel Dashboard

### 500 Error from API
- View logs in Vercel Dashboard → Your Project → Deployments → Click deployment → Functions tab
- Check if Supabase credentials are correct
