# Database Setup Guide

## Quick Setup

The PWA Scanner app requires a Supabase database to store scan history, user profiles, and expiry alerts. Follow these steps to set up your database:

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization and enter project details
5. Wait for the project to be created

### 2. Get Your Project Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Update your `.env.local` file with these credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Set Up Database Tables
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase-setup.sql` from this project
4. Paste it into the SQL Editor
5. Click **Run** to execute the SQL

### 4. Verify Setup
1. Go to **Table Editor** in your Supabase dashboard
2. You should see these tables:
   - `scan_records`
   - `user_profiles` 
   - `expiry_alerts`
3. Refresh your PWA Scanner app

## What Each Table Does

- **scan_records**: Stores all your barcode scans and product information
- **user_profiles**: Stores user preferences and profile data
- **expiry_alerts**: Manages expiry date notifications

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the complete SQL setup script
- Check that all tables were created in the Table Editor
- Verify your environment variables are correct

### Error: "permission denied"
- The RLS (Row Level Security) policies should handle this automatically
- Make sure you're logged in to the app
- Check that the user authentication is working

### App Still Shows Database Warning
- Try refreshing the page
- Check the browser console for specific error messages
- Verify your Supabase project is active and not paused

## Fallback Mode

If you don't set up the database, the app will work in "fallback mode" using local storage. However, you'll lose:
- Persistent scan history across devices
- Expiry date alerts
- Analytics and insights
- Data export functionality

## Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Verify your Supabase project is active
3. Make sure all environment variables are set correctly
4. Try running the SQL setup script again