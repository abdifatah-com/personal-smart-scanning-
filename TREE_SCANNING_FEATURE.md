# 🍃 Leaf Scanning Feature

## Overview
The Leaf Scanning feature allows farmers and gardeners to detect plant diseases by scanning individual leaves using their smartphone camera or by uploading leaf images. This feature integrates with the existing PWA scanner app and provides AI-powered plant disease detection focused on leaf analysis.

## Features

### 🎯 **Leaf Disease Detection**
- **Real-time Analysis**: Upload leaf photos or use camera to scan individual leaves
- **Disease Database**: Comprehensive database of common plant diseases including:
  - Tomato diseases (Early Blight, Late Blight, Bacterial Spot, Leaf Mold, etc.)
  - Potato diseases (Early Blight, Late Blight)
  - Corn diseases (Common Rust, Northern Leaf Blight)
  - Apple diseases (Scab, Black Rot)
  - And many more...

### 📱 **User Interface**
- **Dual Mode**: "Scan a Leaf" or "Upload a Leaf" options
- **Demo Images**: Try the feature with pre-loaded leaf test images
- **Results Display**: Detailed analysis with:
  - Disease name and confidence level
  - Severity assessment (Low/Medium/High)
  - Treatment recommendations
  - Prevention tips
  - Affected area information

### 🔧 **Technical Features**
- **Mock AI Detection**: Simulates ML model predictions
- **Image Processing**: Handles various image formats
- **Responsive Design**: Works on mobile and desktop
- **Copy Results**: Easy sharing of analysis results

## How to Use

### 1. **Access Leaf Scanner**
- Open the PWA scanner app
- Click the "🍃 Scan a Leaf" button on the home screen
- The scanner modal will open with leaf disease detection options

### 2. **Scanning Options**
- **Scan a Leaf**: Point your camera at individual leaves and capture photos
- **Upload a Leaf**: Select leaf images from your device gallery

### 3. **Demo Leaf Images**
- Try the feature with pre-loaded leaf test images
- Click on any demo leaf image to see how the detection works
- Images include various leaf diseases and healthy leaves

### 4. **View Results**
- Get detailed analysis of detected diseases
- See treatment and prevention recommendations
- Copy results to clipboard for sharing

## File Structure

```
src/
├── components/
│   ├── TreeScanner.tsx          # Main tree scanner component
│   ├── PlantDiseaseDetector.tsx # Advanced disease detection UI
│   └── MobileDashboard.tsx      # Updated with tree scanning button
├── app/
│   └── api/
│       └── demo-images/
│           └── route.ts         # API endpoint for serving test images
└── test_images/                 # Plant disease test images
    ├── tomato_early_blight.JPG
    ├── tomato_late_blight.JPG
    ├── tomato_healthy.JPG
    └── ... (more test images)
```

## Integration Points

### **MobileDashboard Updates**
- Added "tree" to actionCategory type
- Added "🍃 Scan a Leaf" button with emerald theme
- Updated scanner modal to conditionally render TreeScanner
- Added tree category gradient styling

### **Scanner Modal**
- Conditionally renders TreeScanner when actionCategory is 'tree'
- Updated modal title to "Leaf Disease Scanner"
- Maintains existing QR code scanning for other categories

## Disease Database

The system includes a comprehensive database of plant diseases with:

- **Disease Names**: Common and scientific names
- **Confidence Levels**: AI prediction confidence (50-95%)
- **Severity Ratings**: Low, Medium, High
- **Treatment Plans**: Specific fungicide and care recommendations
- **Prevention Tips**: Cultural practices to prevent disease
- **Affected Areas**: Which parts of the plant are typically affected

## Future Enhancements

### **Real ML Integration**
- Replace mock detection with actual TensorFlow.js model
- Load the trained model from the Model/ directory
- Implement real-time image processing

### **Additional Features**
- Save scan history for farmers
- Export reports for agricultural advisors
- Integration with weather data for disease risk assessment
- Multi-language support for global farmers

### **Model Training**
- Use the existing Plant Disease Detection model
- Train on additional crop types
- Improve accuracy with more training data

## Testing

### **Demo Images Available**
- Tomato diseases (8 different conditions)
- Potato diseases (3 conditions)
- Corn diseases (2 conditions)
- Apple diseases (2 conditions)
- Healthy plant examples

### **Test the Feature**
1. Start the development server: `npm run dev`
2. Open the app and click "🍃 Scan a Leaf"
3. Try the demo leaf images or upload your own
4. Verify the disease detection and recommendations

## Dependencies

The leaf scanning feature uses existing dependencies:
- React for UI components
- Next.js for API routes
- Tailwind CSS for styling
- No additional dependencies required

## Browser Compatibility

- Works on all modern browsers
- Mobile-optimized for farmers in the field
- PWA support for offline usage
- Camera access for real-time leaf scanning