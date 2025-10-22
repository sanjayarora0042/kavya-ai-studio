import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { DownloadIcon, CloseIcon, LeftArrowIcon, RightArrowIcon, ZoomIcon } from '../constants';

interface ResultDisplayProps {
  editedImages: string[];
  isLoading: boolean;
  error: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ editedImages, isLoading, error }) => {
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasResults = !isLoading && !error && editedImages.length > 0;

  // Reset to the first image when a new set of results is loaded
  useEffect(() => {
    if (editedImages.length > 0) {
      setActiveIndex(0);
    }
  }, [editedImages]);

  const openModal = (imageUrl: string) => {
    setModalImage(imageUrl);
  };

  const closeModal = () => {
    setModalImage(null);
  };
  
  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? editedImages.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setActiveIndex((prev) => (prev === editedImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full h-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 flex flex-col justify-center" style={{minHeight: '30rem'}}>
      <div className="flex-grow flex items-center justify-center">
        {isLoading && <Spinner />}

        {!isLoading && error && (
          <div className="text-center text-red-400">
            <p className="font-bold">An Error Occurred</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && editedImages.length === 0 && (
          <div className="text-center text-gray-500">
            <p>Your 3 generated image results will appear here.</p>
          </div>
        )}

        {hasResults && (
          <div className="flex flex-col h-full w-full items-center">
            {/* Main Image Viewer */}
            <div className="relative group w-full max-w-lg aspect-[4/3] mb-4 bg-gray-900 rounded-lg overflow-hidden">
                <img 
                    src={editedImages[activeIndex]} 
                    alt={`Result ${activeIndex + 1}`} 
                    className="object-contain w-full h-full" 
                />
                
                <div 
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center cursor-pointer"
                    onClick={() => openModal(editedImages[activeIndex])}
                >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIcon />
                    </div>
                </div>

                <a
                    href={editedImages[activeIndex]}
                    download={`luxury-background-${activeIndex + 1}.png`}
                    className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all"
                    aria-label={`Download image ${activeIndex + 1}`}
                    title="Download Image"
                    onClick={(e) => e.stopPropagation()} 
                >
                    <DownloadIcon />
                </a>
                
                {editedImages.length > 1 && (
                    <>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100"
                            aria-label="Previous image"
                        >
                            <LeftArrowIcon />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100"
                            aria-label="Next image"
                        >
                            <RightArrowIcon />
                        </button>
                    </>
                )}
            </div>
            
            {/* Thumbnail Slider */}
            <div className="w-full max-w-lg">
                <div className="flex space-x-2 p-1 overflow-x-auto">
                    {editedImages.map((image, index) => (
                        <div 
                            key={index} 
                            className={`flex-shrink-0 w-24 h-[4.5rem] rounded-md cursor-pointer overflow-hidden transition-all border-2 ${activeIndex === index ? 'border-purple-500' : 'border-transparent hover:border-gray-500'}`}
                            onClick={() => setActiveIndex(index)}
                        >
                            <img 
                                src={image} 
                                alt={`Thumbnail ${index + 1}`} 
                                className="object-cover w-full h-full"
                            />
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal for full-size image view */}
      {modalImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={closeModal} // Close modal on overlay click
        >
          <div 
            className="relative w-full max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
          >
            <img src={modalImage} alt="Full size preview" className="object-contain w-full h-full max-h-[90vh] rounded-lg" />
            <button
              onClick={closeModal}
              className="absolute -top-2 -right-2 sm:top-2 sm:right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
              aria-label="Close image preview"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;