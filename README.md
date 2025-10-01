# personal-smart-scanning-

This is a PWA barcode + expiry scanner built with Next.js 14, Tailwind, html5-qrcode, Tesseract.js, and Supabase.

## Getting Started

## Setup

1. **Supabase Setup**: See `SUPABASE_SETUP.md` for detailed instructions
2. **Environment Variables**: Copy `env.example` to `.env.local` and fill in your Supabase credentials
3. **Icons**: Add PWA icons to `public/icons/`:
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)

## Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENFDA_API_KEY` (optional)
4. Deploy!

The app will be installable as a PWA on mobile devices.
