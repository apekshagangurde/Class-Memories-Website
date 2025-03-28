import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Loader, Download } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ isOpen, imageUrl, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Reset states when the lightbox opens or image changes
  useEffect(() => {
    if (isOpen && imageUrl) {
      setIsLoading(true);
      setImageError(false);
      setIsZoomed(false);
    }
  }, [isOpen, imageUrl]);
  
  if (!isOpen || !imageUrl) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };
  
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `memory-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center backdrop-blur-sm transition-opacity duration-300" 
      onClick={handleBackdropClick}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex space-x-3 z-10">
        <button 
          className="text-white hover:text-gray-300 bg-black bg-opacity-30 p-2 rounded-full"
          onClick={toggleZoom}
          aria-label={isZoomed ? "Zoom out" : "Zoom in"}
          disabled={isLoading || imageError}
        >
          {isZoomed ? <ZoomOut className="h-6 w-6" /> : <ZoomIn className="h-6 w-6" />}
        </button>
        <button 
          className="text-white hover:text-gray-300 bg-black bg-opacity-30 p-2 rounded-full"
          onClick={handleDownload}
          aria-label="Download image"
          disabled={isLoading || imageError}
        >
          <Download className="h-6 w-6" />
        </button>
        <button 
          className="text-white hover:text-gray-300 bg-black bg-opacity-30 p-2 rounded-full"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      {/* Loading indicator */}
      {isLoading && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader className="h-12 w-12 text-white animate-spin" />
        </div>
      )}
      
      {/* Image */}
      <div className={`transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        <img 
          src={imageUrl} 
          alt="Enlarged memory" 
          className={`
            max-w-[92%] max-h-[90vh] mx-auto object-contain
            ${isZoomed ? 'cursor-zoom-out scale-150 transition-transform duration-300' : 'cursor-zoom-in transition-transform duration-300'}
          `}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setImageError(true);
          }}
          onClick={toggleZoom}
        />
      </div>
      
      {/* Error message */}
      {imageError && (
        <div className="text-white text-center">
          <p className="text-xl">Unable to load image</p>
          <p className="text-sm mt-2">The image may have been moved or deleted</p>
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;
