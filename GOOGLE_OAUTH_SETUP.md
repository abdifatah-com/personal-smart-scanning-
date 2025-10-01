# Google OAuth Setup for PWA Scanner

To enable Google authentication in your PWA Scanner app, follow these steps:

## 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - For development: `https://ygqqarmuszobsmyhgpnc.supabase.co/auth/v1/callback`
     - For production: `https://yourdomain.com/auth/v1/callback`

## 2. Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Enable Google provider
4. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Set the redirect URL to: `https://ygqqarmuszobsmyhgpnc.supabase.co/auth/v1/callback`

## 3. Environment Variables (Optional)

If you want to use environment variables instead of hardcoded values, update your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ygqqarmuszobsmyhgpnc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Test the Integration

1. Start your development server: `npm run dev`
2. Go to the login page
3. Click "Continue with Google"
4. Complete the OAuth flow
5. You should be redirected back to your app and logged in

## Troubleshooting

- **Redirect URI mismatch**: Make sure the redirect URI in Google Cloud Console matches exactly with Supabase
- **Invalid client**: Double-check your Client ID and Secret in Supabase
- **CORS issues**: Ensure your domain is added to authorized origins in Google Cloud Console

## Security Notes

- Keep your Client Secret secure and never expose it in client-side code
- Use HTTPS in production
- Regularly rotate your OAuth credentials
- Monitor your OAuth usage in Google Cloud Console

That's it! Your PWA Scanner now supports Google authentication. 🎉