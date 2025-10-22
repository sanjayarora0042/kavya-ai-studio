
import React from 'react';
import { UploadIcon } from '../constants';
import type { ImageData } from '../types';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  originalImage: ImageData | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, originalImage }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
    }
  };

  return (
    <div className="w-full">
        <label
            htmlFor="image-upload"
            className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${originalImage ? 'border-purple-500' : 'border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-700'}`}
        >
            {originalImage ? (
                <img src={originalImage.url} alt="Original upload" className="object-contain h-full w-full rounded-lg" />
            ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadIcon />
                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP (MAX. 4MB)</p>
                </div>
            )}
            <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
        </label>
    </div>
  );
};

export default ImageUpload;
