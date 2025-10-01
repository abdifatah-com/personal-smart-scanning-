"use client";
import { useRef, useState } from "react";
import Tesseract from "tesseract.js";

type Props = {
  onParsed: (text: string) => void;
};

export default function ExpiryOCR({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleFileChange(file: File | null) {
    if (!file) return;
    setIsProcessing(true);
    try {
      const { data } = await Tesseract.recognize(file, "eng");
      const text = data.text || "";
      onParsed(text);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="mt-4">
      <label className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-semibold cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-blue-500/25">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{isProcessing ? "Processing..." : "Upload Image"}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          className="hidden"
          disabled={isProcessing}
        />
      </label>
      {isProcessing && (
        <div className="mt-3 flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span>Extracting text from image...</span>
        </div>
      )}
    </div>
  );
}
