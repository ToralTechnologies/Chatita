'use client';

import { useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface MealPhotoUploadProps {
  onPhotoCapture: (base64: string) => void;
  initialPhoto?: string;
}

export default function MealPhotoUpload({ onPhotoCapture, initialPhoto }: MealPhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialPhoto || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB for base64 storage)
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo is too large. Please choose a photo under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      onPhotoCapture(base64);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPreview(null);
    onPhotoCapture('');
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Meal preview"
            className="w-full rounded-lg object-cover max-h-96"
          />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Remove photo"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2 font-medium">Take or upload a photo of your meal</p>
          <p className="text-sm text-gray-500 mb-6">Optional, but helps with tracking and AI analysis</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Camera Button */}
            <label className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-button cursor-pointer hover:bg-primary-dark transition-colors">
              <Camera className="w-5 h-5" />
              Take Photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Gallery Button */}
            <label className="inline-flex items-center gap-2 bg-white border-2 border-primary text-primary px-6 py-3 rounded-button cursor-pointer hover:bg-primary/10 transition-colors">
              <Upload className="w-5 h-5" />
              Choose from Gallery
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
