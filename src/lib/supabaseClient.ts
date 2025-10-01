import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ygqqarmuszobsmyhgpnc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncXFhcm11c3pvYnNteWhncG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzg2MzAsImV4cCI6MjA3MzcxNDYzMH0.xz2nx8v2GnCqrld3lYWtwwQv4QyRnoi-UL-eadKBW4U";

export const supabase = createClient(supabaseUrl, supabaseKey);

export type ScanRecord = {
  id: string;
  user_id: string;
  barcode: string;
  product_name: string | null;
  brand: string | null;
  expiry_date: string | null;
  is_expired: boolean | null;
  source: "cache" | "openfoodfacts" | "openfda" | "manual";
  created_at: string;
};

export type UserProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  plan_tier: "basic" | "premium" | "advanced";
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
