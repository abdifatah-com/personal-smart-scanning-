export default function FAQPage() {
  return (
    <div className="min-h-screen px-6 py-8" style={{background: 'var(--background)', color: 'var(--foreground)'}}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">FAQ</h1>
        <div className="rounded-2xl p-6 border space-y-6" style={{background: 'var(--card)', borderColor: 'var(--border)'}}>
          <div>
            <h2 className="text-lg font-semibold">How do scans work?</h2>
            <p className="opacity-80 mt-1">Use your camera or upload an image. We detect the barcode and fetch product details.</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Which sources are used?</h2>
            <p className="opacity-80 mt-1">Open Food Facts, OpenFDA, and Open Beauty Facts.</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">What features come with each plan?</h2>
            <p className="opacity-80 mt-1">Basic (Free), Premium ($5), Advanced ($15). See the Plans tab for details.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
