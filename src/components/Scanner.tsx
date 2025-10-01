"use client";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef } from "react";

type Props = {
  onDetected: (text: string) => void;
};

export default function Scanner({ onDetected }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const id = "scanner-root";
    const div = document.createElement("div");
    div.id = id;
    containerRef.current.appendChild(div);

    const scanner = new Html5QrcodeScanner(id, { fps: 10, qrbox: 250 }, false);
    scanner.render(
      (decodedText) => {
        onDetected(decodedText);
        scanner.clear();
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
      div.remove();
    };
  }, [onDetected]);

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden" />
    </div>
  );
}
