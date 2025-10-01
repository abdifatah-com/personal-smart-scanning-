# PWA Scanner Setup Instructions

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Supabase Database
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **"Run"** to execute the SQL
5. This will create all necessary tables and security policies

### 3. Configure Google OAuth (Optional)
1. Follow the instructions in `GOOGLE_OAUTH_SETUP.md`
2. This enables "Continue with Google" authentication

### 4. Start the Development Server
```bash
npm run dev
```

### 5. Open the App
Navigate to `http://localhost:3000`

## 🔧 Troubleshooting

### Database Connection Error
If you see a yellow warning banner about database setup:
1. Make sure you've run the SQL schema in Supabase
2. Check that your Supabase URL and API key are correct
3. Click "Refresh connection" in the warning banner

### Google OAuth Not Working
1. Verify your Google OAuth credentials in Supabase
2. Check that redirect URIs are correctly configured
3. Ensure the Google+ API is enabled in Google Cloud Console

### Scanner Not Working
1. Make sure you're using HTTPS in production
2. Check browser permissions for camera access
3. Try refreshing the page

## 📱 Features

- **Barcode Scanning**: Real-time camera-based barcode scanning
- **Product Search**: Search through your scan history
- **OCR Expiry Detection**: Upload images to extract expiry dates
- **Analytics Dashboard**: View scan statistics and trends
- **Export Data**: Download scan history as CSV or JSON
- **Expiry Alerts**: Set up notifications for product expiry dates
- **Google Authentication**: Sign in with your Google account
- **Responsive Design**: Works on desktop and mobile devices

## 🗄️ Database Schema

The app uses the following Supabase tables:
- `scan_records`: Stores barcode scan history
- `user_profiles`: Stores user profile information
- `expiry_alerts`: Stores expiry date alerts

All tables have Row Level Security (RLS) enabled for data protection.

## 🔒 Security

- All data is user-specific and isolated
- Row Level Security prevents cross-user data access
- OAuth integration with secure redirect handling
- Input validation and sanitization

## 📦 Production Deployment

1. Build the app: `npm run build`
2. Deploy to your preferred platform (Vercel, Netlify, etc.)
3. Update Supabase redirect URIs for your production domain
4. Configure environment variables if needed

That's it! Your PWA Scanner is ready to use! 🎉