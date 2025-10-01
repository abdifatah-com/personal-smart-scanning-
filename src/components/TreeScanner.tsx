"use client";
import PlantDiseaseDetector from "./PlantDiseaseDetector";

type Props = {
  onDetected: (text: string) => void;
  onImageCapture: (imageData: string) => void;
};

export default function TreeScanner({ onDetected, onImageCapture }: Props) {
  return <PlantDiseaseDetector />;
}