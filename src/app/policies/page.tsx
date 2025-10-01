export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-gray-100 px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-4">Policies</h1>
        <div className="rounded-2xl bg-white p-6 border border-gray-200 space-y-6 text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-black">Privacy Policy</h2>
            <p className="mt-1">We only store the data needed to provide the service. You can request deletion of your account data anytime.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-black">Terms of Use</h2>
            <p className="mt-1">By using this app, you agree not to misuse the service or attempt unauthorized access.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-black">Data Sources</h2>
            <p className="mt-1">Product information comes from Open Food Facts, OpenFDA, and Open Beauty Facts. Accuracy is not guaranteed.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
