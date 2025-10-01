export default function AboutPage() {
  return (
    <div className="min-h-screen px-6 py-8" style={{background: 'var(--background)', color: 'var(--foreground)'}}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">About the App</h1>
        <div className="rounded-2xl p-6 border space-y-3" style={{background: 'var(--card)', borderColor: 'var(--border)'}}>
          <p className="opacity-80">PWA Scanner helps you scan barcodes, fetch product details, and track expiry dates.</p>
          <p className="opacity-80">It integrates with Open Food Facts, OpenFDA, and Open Beauty Facts to retrieve product information.</p>
          <p className="opacity-80">Upgrade plans to unlock more features like analytics, exports, and expiry alerts.</p>
          <div className="pt-3">
            <a href="/faq" className="inline-block rounded-xl px-4 py-2 font-semibold" style={{background: 'var(--foreground)', color: 'var(--background)'}}>
              FAQ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
