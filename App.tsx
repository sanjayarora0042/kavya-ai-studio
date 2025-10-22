import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import PromptInput from './components/PromptInput';
import ResultDisplay from './components/ResultDisplay';
import Footer from './components/Footer';
import type { ImageData } from './types';
import { editImageWithPrompt } from './services/geminiService';
import { UploadIcon } from './constants';

// --- Helper Component for Watermark UI ---
interface WatermarkOptionsProps {
  watermarkType: 'none' | 'text' | 'image';
  setWatermarkType: (type: 'none' | 'text' | 'image') => void;
  watermarkText: string;
  setWatermarkText: (text: string) => void;
  onWatermarkUpload: (file: File) => void;
  watermarkImage: ImageData | null;
  watermarkSize: number;
  setWatermarkSize: (size: number) => void;
  watermarkPosition: string;
  setWatermarkPosition: (position: string) => void;
}

const WatermarkOptions: React.FC<WatermarkOptionsProps> = ({
  watermarkType,
  setWatermarkType,
  watermarkText,
  setWatermarkText,
  onWatermarkUpload,
  watermarkImage,
  watermarkSize,
  setWatermarkSize,
  watermarkPosition,
  setWatermarkPosition,
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onWatermarkUpload(event.target.files[0]);
    }
  };

  const positions = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];
    
  return (
    <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
      <div className="flex items-center space-x-4">
        <label className="flex items-center cursor-pointer">
          <input type="radio" name="watermarkType" value="none" checked={watermarkType === 'none'} onChange={() => setWatermarkType('none')} className="h-4 w-4 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-500"/>
          <span className="ml-2 text-gray-300">None</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input type="radio" name="watermarkType" value="text" checked={watermarkType === 'text'} onChange={() => setWatermarkType('text')} className="h-4 w-4 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-500"/>
          <span className="ml-2 text-gray-300">Text</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input type="radio" name="watermarkType" value="image" checked={watermarkType === 'image'} onChange={() => setWatermarkType('image')} className="h-4 w-4 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-500"/>
          <span className="ml-2 text-gray-300">Image</span>
        </label>
      </div>

      {watermarkType === 'text' && (
        <input
          type="text"
          value={watermarkText}
          onChange={(e) => setWatermarkText(e.target.value)}
          placeholder="Enter watermark text"
          className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder-gray-500"
        />
      )}

      {watermarkType === 'image' && (
        <label
            htmlFor="watermark-upload"
            className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-gray-600 hover:border-gray-500 bg-gray-800 hover:bg-gray-700"
        >
            {watermarkImage ? (
                <img src={watermarkImage.url} alt="Watermark preview" className="object-contain h-full w-full rounded-lg p-2" />
            ) : (
                <div className="flex flex-col items-center justify-center text-center">
                    <UploadIcon />
                    <p className="text-xs text-gray-400"><span className="font-semibold">Upload watermark</span></p>
                    <p className="text-xs text-gray-500">PNG recommended</p>
                </div>
            )}
            <input id="watermark-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
        </label>
      )}

      {watermarkType !== 'none' && (
        <div className="space-y-4 pt-2">
            <div>
              <label htmlFor="watermark-size" className="block text-sm font-medium text-gray-300 mb-1">Size ({watermarkSize}%)</label>
              <input
                id="watermark-size"
                type="range"
                min="5"
                max="50"
                value={watermarkSize}
                onChange={(e) => setWatermarkSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <div className="grid grid-cols-3 gap-2">
                  {positions.map(pos => (
                      <button
                          key={pos}
                          onClick={() => setWatermarkPosition(pos)}
                          className={`h-10 rounded-md flex items-center justify-center border-2 transition-colors ${watermarkPosition === pos ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600 bg-gray-800 hover:border-gray-500'}`}
                          title={pos.replace('-', ' ')}
                          aria-label={`Set watermark position to ${pos.replace('-', ' ')}`}
                      >
                          <div className={`h-2 w-2 rounded-full ${watermarkPosition === pos ? 'bg-purple-400' : 'bg-gray-500'}`}></div>
                      </button>
                  ))}
              </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Main App Component ---
const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [editedImages, setEditedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [watermarkType, setWatermarkType] = useState<'none' | 'text' | 'image'>('none');
  const [watermarkText, setWatermarkText] = useState<string>('Your Brand');
  const [watermarkImage, setWatermarkImage] = useState<ImageData | null>(null);
  const [watermarkSize, setWatermarkSize] = useState<number>(15); // As percentage
  const [watermarkPosition, setWatermarkPosition] = useState<string>('bottom-right');


  const fileToBase64 = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
          reject(new Error("File size exceeds 4MB."));
          return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const url = reader.result as string;
        const base64 = url.split(',')[1];
        resolve({ base64, mimeType: file.type, url });
      };
      reader.onerror = (error) => reject(error);
    });
  };
  
  const handleImageUpload = useCallback(async (file: File) => {
    setError(null);
    setEditedImages([]);
    try {
        const imageData = await fileToBase64(file);
        setOriginalImage(imageData);
    } catch(err) {
        if(err instanceof Error) {
            setError(err.message);
        } else {
            setError("Failed to process image file.");
        }
        setOriginalImage(null);
    }
  }, []);

  const handleWatermarkUpload = useCallback(async (file: File) => {
    setError(null);
    try {
        const imageData = await fileToBase64(file);
        setWatermarkImage(imageData);
    } catch(err) {
        if(err instanceof Error) {
            setError(`Watermark Error: ${err.message}`);
        } else {
            setError("Failed to process watermark image file.");
        }
        setWatermarkImage(null);
    }
  }, []);
  
  const applyWatermark = useCallback((imageUrl: string): Promise<string> => {
    if (watermarkType === 'none') {
        return Promise.resolve(imageUrl);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        ctx.drawImage(img, 0, 0);
        const padding = Math.round(canvas.width / 50);

        const getWatermarkCoordinates = (
            watermarkWidth: number,
            watermarkHeight: number,
        ) => {
            const [vAlign, hAlign] = watermarkPosition.split('-');
            
            let x = 0;
            if (hAlign === 'left') x = padding;
            else if (hAlign === 'center') x = (canvas.width - watermarkWidth) / 2;
            else x = canvas.width - watermarkWidth - padding;

            let y = 0;
            if (vAlign === 'top') y = padding;
            else if (vAlign === 'middle') y = (canvas.height - watermarkHeight) / 2;
            else y = canvas.height - watermarkHeight - padding;
            
            return { x, y };
        };

        if (watermarkType === 'text' && watermarkText) {
          // Dynamic font size based on image width and size control
          const fontSize = Math.max(24, (canvas.width * watermarkSize) / 100 * 0.20);
          ctx.font = `bold ${fontSize}px Sans-Serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          
          const metrics = ctx.measureText(watermarkText);
          const textWidth = metrics.width;
          const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
          
          const { x, y } = getWatermarkCoordinates(textWidth, textHeight);

          // Adjust text alignment for canvas fillText method
          const [vAlign, hAlign] = watermarkPosition.split('-');
          ctx.textAlign = hAlign as CanvasTextAlign;
          ctx.textBaseline = vAlign as CanvasTextBaseline;

          let finalX = x;
          if (hAlign === 'center') finalX = x + textWidth / 2;
          if (hAlign === 'right') finalX = x + textWidth;

          let finalY = y;
          if (vAlign === 'middle') finalY = y + textHeight / 2;
          if (vAlign === 'bottom') finalY = y + textHeight;
          
          ctx.fillText(watermarkText, finalX, finalY);
          resolve(canvas.toDataURL('image/png'));

        } else if (watermarkType === 'image' && watermarkImage) {
          const wmImg = new Image();
          wmImg.crossOrigin = 'anonymous';
          wmImg.onload = () => {
            const wmMaxWidth = img.width * (watermarkSize / 100);
            const scale = Math.min(1, wmMaxWidth / wmImg.width);
            const wmWidth = wmImg.width * scale;
            const wmHeight = wmImg.height * scale;
            
            const { x, y } = getWatermarkCoordinates(wmWidth, wmHeight);

            ctx.globalAlpha = 0.7;
            ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
            ctx.globalAlpha = 1.0;
            
            resolve(canvas.toDataURL('image/png'));
          };
          wmImg.onerror = () => reject(new Error('Failed to load watermark image.'));
          wmImg.src = watermarkImage.url;
        } else {
          resolve(imageUrl);
        }
      };
      img.onerror = () => reject(new Error('Failed to load generated image.'));
      img.src = imageUrl;
    });
  }, [watermarkType, watermarkText, watermarkImage, watermarkSize, watermarkPosition]);


  const handleSubmit = useCallback(async () => {
    if (!originalImage || !prompt) {
      setError("Please upload an image and provide a prompt.");
      return;
    }
    if (watermarkType === 'image' && !watermarkImage) {
      setError("Please upload a watermark image or select a different option.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImages([]);

    try {
      const resultImageUrls = await editImageWithPrompt(
        originalImage.base64,
        originalImage.mimeType,
        prompt
      );
      
      const watermarkedImages = await Promise.all(
        resultImageUrls.map(url => applyWatermark(url))
      );
      setEditedImages(watermarkedImages);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt, applyWatermark, watermarkImage, watermarkType]);

  return (
    <div className="min-h-screen bg-gray-900 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          <div className="flex flex-col space-y-8 bg-gray-800/50 backdrop-blur-sm p-6 border border-gray-700 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-300 border-b border-gray-700 pb-3">Controls</h2>
            
            <div className="space-y-3">
                <h3 className="text-xl font-medium text-gray-300">1. Upload Photo</h3>
                <ImageUpload onImageUpload={handleImageUpload} originalImage={originalImage} />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-medium text-gray-300">2. Add Watermark <span className="text-sm text-gray-500">(Optional)</span></h3>
              <WatermarkOptions
                watermarkType={watermarkType}
                setWatermarkType={setWatermarkType}
                watermarkText={watermarkText}
                setWatermarkText={setWatermarkText}
                onWatermarkUpload={handleWatermarkUpload}
                watermarkImage={watermarkImage}
                watermarkSize={watermarkSize}
                setWatermarkSize={setWatermarkSize}
                watermarkPosition={watermarkPosition}
                setWatermarkPosition={setWatermarkPosition}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-medium text-gray-300">3. Describe &amp; Generate</h3>
              <PromptInput
                prompt={prompt}
                setPrompt={setPrompt}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                isReady={!!originalImage && !!prompt && (watermarkType !== 'image' || !!watermarkImage)}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-6">
            <h2 className="text-2xl font-bold text-gray-300 border-b border-gray-700 pb-3">AI Generated Results</h2>
            <ResultDisplay editedImages={editedImages} isLoading={isLoading} error={error} />
          </div>
          
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
