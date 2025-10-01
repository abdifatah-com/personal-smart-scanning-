"use client";
import { useState, useRef, useCallback } from "react";

type DiseaseResult = {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
  severity: 'low' | 'medium' | 'high';
  affectedArea: string;
};

// Mock disease database based on the test images
const DISEASE_DATABASE: Record<string, DiseaseResult> = {
  'tomato_early_blight': {
    disease: 'Tomato Early Blight',
    confidence: 0.87,
    treatment: 'Apply copper-based fungicide every 7-10 days. Remove infected leaves and improve air circulation. Use chlorothalonil or mancozeb fungicides.',
    prevention: 'Water at soil level, avoid overhead watering. Use mulch to prevent soil splash. Space plants properly for good air circulation.',
    severity: 'medium',
    affectedArea: 'Leaves, stems, and fruit'
  },
  'tomato_late_blight': {
    disease: 'Tomato Late Blight',
    confidence: 0.92,
    treatment: 'Apply fungicide containing chlorothalonil or mancozeb immediately. Remove and destroy infected plants. Use systemic fungicides.',
    prevention: 'Ensure good drainage, space plants properly, and avoid working in wet conditions. Use resistant varieties.',
    severity: 'high',
    affectedArea: 'Leaves, stems, and fruit'
  },
  'tomato_bacterial_spot': {
    disease: 'Tomato Bacterial Spot',
    confidence: 0.78,
    treatment: 'Apply copper-based bactericide. Remove infected plant debris and avoid overhead watering. Use streptomycin if severe.',
    prevention: 'Use disease-free seeds, rotate crops, and maintain proper plant spacing. Avoid working with wet plants.',
    severity: 'medium',
    affectedArea: 'Leaves, stems, and fruit'
  },
  'tomato_leaf_mold': {
    disease: 'Tomato Leaf Mold',
    confidence: 0.85,
    treatment: 'Improve air circulation and reduce humidity. Apply fungicides containing chlorothalonil or mancozeb.',
    prevention: 'Space plants properly, use drip irrigation, and maintain low humidity in greenhouse environments.',
    severity: 'medium',
    affectedArea: 'Leaves'
  },
  'tomato_mosaic_virus': {
    disease: 'Tomato Mosaic Virus',
    confidence: 0.90,
    treatment: 'No cure available. Remove and destroy infected plants immediately. Control aphids and other vectors.',
    prevention: 'Use virus-free seeds, control aphids, disinfect tools, and avoid tobacco use near plants.',
    severity: 'high',
    affectedArea: 'Entire plant'
  },
  'tomato_septoria_leaf_spot': {
    disease: 'Tomato Septoria Leaf Spot',
    confidence: 0.82,
    treatment: 'Apply fungicides containing chlorothalonil or mancozeb. Remove infected leaves and debris.',
    prevention: 'Crop rotation, proper spacing, and avoiding overhead watering. Remove plant debris from field.',
    severity: 'medium',
    affectedArea: 'Leaves'
  },
  'tomato_spider_mites': {
    disease: 'Tomato Spider Mites',
    confidence: 0.88,
    treatment: 'Apply miticides or insecticidal soap. Increase humidity and use predatory mites. Neem oil can help.',
    prevention: 'Maintain proper humidity, avoid dusty conditions, and monitor regularly for early detection.',
    severity: 'medium',
    affectedArea: 'Leaves'
  },
  'tomato_target_spot': {
    disease: 'Tomato Target Spot',
    confidence: 0.79,
    treatment: 'Apply fungicides containing chlorothalonil or mancozeb. Remove infected plant debris.',
    prevention: 'Crop rotation, proper spacing, and avoiding overhead watering. Use resistant varieties if available.',
    severity: 'medium',
    affectedArea: 'Leaves and fruit'
  },
  'tomato_healthy': {
    disease: 'Healthy Tomato Plant',
    confidence: 0.95,
    treatment: 'No treatment needed. Continue current care routine and monitor regularly.',
    prevention: 'Maintain good growing conditions, proper watering, regular monitoring, and preventive care.',
    severity: 'low',
    affectedArea: 'None'
  },
  'potato_early_blight': {
    disease: 'Potato Early Blight',
    confidence: 0.84,
    treatment: 'Apply fungicides containing chlorothalonil or mancozeb. Remove infected leaves and improve air circulation.',
    prevention: 'Crop rotation, proper spacing, and avoiding overhead watering. Use resistant varieties.',
    severity: 'medium',
    affectedArea: 'Leaves and stems'
  },
  'potato_late_blight': {
    disease: 'Potato Late Blight',
    confidence: 0.91,
    treatment: 'Apply fungicides containing chlorothalonil or mancozeb immediately. Remove and destroy infected plants.',
    prevention: 'Ensure good drainage, space plants properly, and avoid working in wet conditions.',
    severity: 'high',
    affectedArea: 'Leaves, stems, and tubers'
  },
  'potato_healthy': {
    disease: 'Healthy Potato Plant',
    confidence: 0.93,
    treatment: 'No treatment needed. Continue current care routine.',
    prevention: 'Maintain good growing conditions, proper watering, and regular monitoring.',
    severity: 'low',
    affectedArea: 'None'
  },
  'corn_common_rust': {
    disease: 'Corn Common Rust',
    confidence: 0.86,
    treatment: 'Apply fungicides containing azoxystrobin or propiconazole. Remove infected plant debris.',
    prevention: 'Plant resistant varieties, ensure proper spacing, and avoid overhead watering.',
    severity: 'medium',
    affectedArea: 'Leaves'
  },
  'corn_northern_leaf_blight': {
    disease: 'Corn Northern Leaf Blight',
    confidence: 0.89,
    treatment: 'Apply fungicides containing azoxystrobin or propiconazole. Remove infected plant debris.',
    prevention: 'Crop rotation, plant resistant varieties, and proper field sanitation.',
    severity: 'medium',
    affectedArea: 'Leaves'
  },
  'apple_scab': {
    disease: 'Apple Scab',
    confidence: 0.87,
    treatment: 'Apply fungicides containing captan or myclobutanil. Remove infected leaves and fruit.',
    prevention: 'Plant resistant varieties, ensure good air circulation, and remove fallen leaves.',
    severity: 'medium',
    affectedArea: 'Leaves and fruit'
  },
  'apple_healthy': {
    disease: 'Healthy Apple Tree',
    confidence: 0.94,
    treatment: 'No treatment needed. Continue current care routine.',
    prevention: 'Maintain good growing conditions, proper pruning, and regular monitoring.',
    severity: 'low',
    affectedArea: 'None'
  }
};

// Simulate ML model prediction
const predictDisease = async (imageData: string): Promise<DiseaseResult> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Get random disease from database for demo
  const diseases = Object.values(DISEASE_DATABASE);
  const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
  
  // Add some randomness to confidence
  const confidence = Math.min(0.95, randomDisease.confidence + (Math.random() - 0.5) * 0.1);
  
  return {
    ...randomDisease,
    confidence: Math.max(0.5, confidence)
  };
};

type DetectorProps = {
  compact?: boolean;
};

export default function PlantDiseaseDetector({ compact = false }: DetectorProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<DiseaseResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [showScanInterface, setShowScanInterface] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        analyzeImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      const result = await predictDisease(imageData);
      setDiseaseResult(result);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      // Fallback to file input if camera blocked/not available
      fileInputRef.current?.click();
    }
  }, []);

  const stopCamera = useCallback(() => {
    cameraStream?.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setShowCamera(false);
  }, [cameraStream]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    analyzeImage(dataUrl);
    stopCamera();
  }, [analyzeImage, stopCamera]);

  const resetScan = useCallback(() => {
    setCapturedImage(null);
    setDiseaseResult(null);
    setIsAnalyzing(false);
    setShowScanInterface(false);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (capturedImage) {
    return (
      <div className="w-full space-y-4">
        <div className="relative">
          <img 
            src={capturedImage} 
            alt="Captured plant" 
            className="w-full h-64 object-cover rounded-xl"
          />
          <button
            onClick={resetScan}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
          >
            ✕
          </button>
        </div>

        {isAnalyzing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            {!compact && (
              <>
            <p className="text-gray-600">Analyzing plant health...</p>
            <p className="text-sm text-gray-500 mt-2">Using AI to detect diseases and pests</p>
              </>
            )}
          </div>
        )}

        {diseaseResult && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Analysis Results</h3>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(diseaseResult.severity)}`}>
                  {diseaseResult.severity.toUpperCase()} SEVERITY
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {Math.round(diseaseResult.confidence * 100)}% confidence
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Detected:</h4>
                <p className="text-lg font-medium text-gray-800">{diseaseResult.disease}</p>
                {!compact && (
                <p className="text-sm text-gray-600 mt-1">Affected Area: {diseaseResult.affectedArea}</p>
                )}
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Treatment:</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {diseaseResult.treatment}
                </p>
              </div>
              
              {!compact && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Prevention:</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {diseaseResult.prevention}
                </p>
              </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
            <button
              onClick={resetScan}
              className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-amber-500 hover:to-amber-600 transition-colors"
            >
              🍃 Scan Another Leaf
            </button>
              <button
                onClick={() => {
                  // Copy results to clipboard
                  const resultText = `Plant Disease Analysis:
Condition: ${diseaseResult.disease}
Confidence: ${Math.round(diseaseResult.confidence * 100)}%
Severity: ${diseaseResult.severity.toUpperCase()}
Affected Area: ${diseaseResult.affectedArea}

Treatment: ${diseaseResult.treatment}

Prevention: ${diseaseResult.prevention}`;
                  navigator.clipboard.writeText(resultText);
                  alert('Results copied to clipboard!');
                }}
                className="px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                📋 Copy
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 flex flex-col items-center">
      {/* Hidden file input shared by both Camera and Upload modes */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
      {/* Initial Action Buttons */}
      {!showScanInterface && (
        <div className="flex justify-center space-x-4 mb-6">
        <button
            onClick={() => {
              setScanMode('camera');
              setShowScanInterface(true);
            }}
            className="py-3 px-6 rounded-xl font-semibold transition-colors bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg"
        >
          🍃 Scan a Leaf
        </button>
        <button
            onClick={() => {
              setScanMode('upload');
              setShowScanInterface(true);
            }}
            className="py-3 px-6 rounded-xl font-semibold transition-colors bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg"
        >
          📁 Upload a Leaf
        </button>
      </div>
      )}

      {/* Mode Selection (only shown when scan interface is active) */}
      {showScanInterface && (
        <div className="flex justify-center space-x-2 mb-4">
          <button
            onClick={() => setScanMode('camera')}
            className={`py-2 px-5 rounded-lg font-semibold transition-colors min-w-[120px] ${
              scanMode === 'camera'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            🍃 Scan
          </button>
          <button
            onClick={() => setScanMode('upload')}
            className={`py-2 px-5 rounded-lg font-semibold transition-colors min-w-[120px] ${
              scanMode === 'upload'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            📁 Upload
          </button>
        </div>
      )}

      {/* Scan Interface (only shown when activated) */}
      {showScanInterface && (
        <>
      {scanMode === 'camera' ? (
            <div className="w-full max-w-md">
              <div className="bg-gray-100 rounded-xl p-6 text-center">
                {!showCamera && (
                  <>
                    <div className="mb-4">
                      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    {!compact && <p className="text-gray-600 mb-4">Point camera at plant leaves for detection</p>}
                    <button
                      onClick={startCamera}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-colors"
                    >
                      🍃 Capture Photo
                    </button>
                  </>
                )}
                {showCamera && (
                  <div className="space-y-3">
                    <video ref={videoRef} className="w-full rounded-lg bg-black" playsInline muted></video>
                    <div className="flex gap-2 justify-center">
                      <button onClick={takePhoto} className="bg-black text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-800">Take Photo</button>
                      <button onClick={stopCamera} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
        </div>
      ) : (
            <div className="w-full max-w-md text-center py-6">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
              {!compact && <p className="text-gray-600 mb-4">Upload a clear photo of plant leaves</p>}
              <button
            onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-colors"
          >
                📁 Choose Image
          </button>
        </div>
          )}
        </>
      )}

      {/* Instructions (compact) */}
      <div className="w-full max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-semibold text-blue-800 mb-1">🍃 Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Good lighting</li>
          <li>• Focus a single leaf</li>
          <li>• Hold steady</li>
        </ul>
      </div>

      {/* Demo Images (suggestions) */}
      <div className="w-full max-w-md mx-auto bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">🍃 Try with Demo Leaf Images:</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Tomato Early Blight', file: 'tomato_early_blight.JPG' },
            { name: 'Tomato Late Blight', file: 'tomato_late_blight.JPG' },
            { name: 'Healthy Tomato', file: 'tomato_healthy.JPG' },
            { name: 'Apple Scab', file: 'Apple_scab.JPG' }
          ].map((demo, index) => (
            <button
              key={index}
              onClick={() => {
                // Load demo image via fetch to avoid full page navigation
                const demoImage = `/api/demo-images?image=${demo.file}`;
                setCapturedImage(demoImage);
                analyzeImage(demoImage);
              }}
              className="p-2 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="text-xs font-medium text-gray-700">{demo.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}