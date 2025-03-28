import React from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ isOpen, imageUrl, onClose }) => {
  if (!isOpen || !imageUrl) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center backdrop-blur-sm" 
      onClick={handleBackdropClick}
    >
      <button 
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <X className="h-8 w-8" />
      </button>
      <img 
        src={imageUrl} 
        alt="Enlarged memory" 
        className="max-w-[90%] max-h-[90vh] object-contain" 
      />
    </div>
  );
};

export default ImageLightbox;
