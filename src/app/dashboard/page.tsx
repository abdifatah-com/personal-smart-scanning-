"use client";
import { Suspense } from "react";
import MobileDashboard from "@/components/MobileDashboard";

function DashboardContent() {
  return <MobileDashboard />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-lg">Loading...</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}