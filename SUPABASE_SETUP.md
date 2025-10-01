# Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run this to create the scans table:

```sql
CREATE TABLE scans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode text,
  product_name text,
  brand text,
  expiry_date text,
  is_expired boolean,
  source text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create index for faster barcode lookups
CREATE INDEX idx_scans_barcode ON scans(barcode);
```

3. Go to Settings > API to get your URL and anon key
4. Copy `env.example` to `.env.local` and fill in the values