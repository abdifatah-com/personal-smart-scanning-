-- PWA Scanner Database Setup
-- Run this in your Supabase SQL Editor

-- Create scan_records table
CREATE TABLE IF NOT EXISTS scan_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  product_name TEXT,
  brand TEXT,
  expiry_date DATE,
  is_expired BOOLEAN,
  source TEXT CHECK (source IN ('cache', 'openfoodfacts', 'openfda', 'manual', 'notFound')) DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table for additional user data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  plan_tier TEXT CHECK (plan_tier IN ('basic','premium','advanced')) DEFAULT 'basic',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expiry_alerts table for notifications
CREATE TABLE IF NOT EXISTS expiry_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_record_id UUID REFERENCES scan_records(id) ON DELETE CASCADE,
  alert_date DATE NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_records_user_id ON scan_records(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_records_created_at ON scan_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_records_barcode ON scan_records(barcode);
CREATE INDEX IF NOT EXISTS idx_expiry_alerts_user_id ON expiry_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_expiry_alerts_alert_date ON expiry_alerts(alert_date);

-- Enable Row Level Security (RLS)
ALTER TABLE scan_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expiry_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scan_records
CREATE POLICY "Users can view their own scan records" ON scan_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan records" ON scan_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan records" ON scan_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scan records" ON scan_records
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for expiry_alerts
CREATE POLICY "Users can view their own expiry alerts" ON expiry_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expiry alerts" ON expiry_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expiry alerts" ON expiry_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expiry alerts" ON expiry_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, plan_tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'basic'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_scan_records_updated_at
  BEFORE UPDATE ON scan_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();