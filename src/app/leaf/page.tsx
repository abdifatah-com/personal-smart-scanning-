"use client";
import AuthGuard from "@/components/AuthGuard";
import PlantDiseaseDetector from "@/components/PlantDiseaseDetector";
import { useRouter } from "next/navigation";

export default function LeafPage() {
  const router = useRouter();
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-6">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-fuchsia-500 text-white font-bold shadow-sm">★</span>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Scan a Leaf</h1>
                <div className="text-[11px] text-amber-600 font-semibold">Premium</div>
              </div>
            </div>
            <button onClick={() => router.push('/dashboard?tab=home')} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition">Back</button>
          </div>
          <div className="rounded-2xl bg-white/90 backdrop-blur p-4 shadow-lg ring-1 ring-black/5">
            <PlantDiseaseDetector compact />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

