import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { type Memory } from '../lib/firebase';
import traditionalDayImage from '../assets/traditional_day.jpg';
import classPhotoImage from '../assets/class_photo_new.jpg';
import { Image as ImageIcon, Star } from 'lucide-react';
import MemoryReactions from './MemoryReactions';

interface MemoryCardProps {
  memory: Memory;
  onImageClick: (imageUrl: string) => void;
  onReactionAdded?: () => void;
}

export default function MemoryCard({ memory, onImageClick, onReactionAdded }: MemoryCardProps) {
  const formattedDate = format(memory.createdAt, 'PPP');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);
  
  // Use the appropriate local image based on content or fallback to the provided URL
  let displayImageUrl = memory.imageUrl;
  
  // Special case for Traditional Day memory by Apeksha
  if (memory.author === "Apeksha" && memory.title.includes("Traditional Day")) {
    displayImageUrl = traditionalDayImage;
  }
  
  // Special case for "placeholder-for-traditional-day"
  if (memory.imageUrl === "placeholder-for-traditional-day") {
    displayImageUrl = traditionalDayImage;
  }
  
  // If this is the special case for our class photo memory
  if (memory.id === "traditional-day-memory") {
    displayImageUrl = classPhotoImage;
  }
  
  useEffect(() => {
    // Reset states when memory changes
    if (displayImageUrl) {
      setImageLoaded(false);
      setIsImageError(false);
      
      // Preload the image for smoother transitions
      const img = new Image();
      img.src = displayImageUrl;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setIsImageError(true);
    }
  }, [displayImageUrl]);

  // Handle image click with proper error checking
  const handleImageClick = () => {
    if (displayImageUrl && !isImageError) {
      onImageClick(displayImageUrl);
    }
  };
  
  return (
    <Card className={`memory-card overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${memory.featured ? 'ring-2 ring-amber-400' : ''}`}>
      {/* Featured Badge for 5-star memories */}
      {memory.featured && (
        <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-amber-400 to-yellow-300 text-white px-3 py-1 rounded-full shadow-md flex items-center space-x-1">
          <Star className="h-4 w-4 fill-white" />
          <span className="text-xs font-bold">5-Star Memory</span>
        </div>
      )}
      
      {(displayImageUrl || memory.id === "traditional-day-memory") && (
        <div className="relative h-56 overflow-hidden bg-gray-50">
          {!imageLoaded && !isImageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
            </div>
          )}
          
          {isImageError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
              <ImageIcon className="h-10 w-10 mb-2" />
              <p className="text-sm">Image unavailable</p>
            </div>
          ) : (
            <img 
              src={displayImageUrl} 
              alt={`Memory: ${memory.title}`} 
              className={`w-full h-full object-cover cursor-pointer transition-all duration-500 ${imageLoaded ? 'opacity-100 hover:scale-105' : 'opacity-0'}`}
              style={{ transition: 'opacity 0.3s ease-in-out' }}
              onClick={handleImageClick}
              onLoad={() => setImageLoaded(true)}
              onError={() => setIsImageError(true)}
            />
          )}
        </div>
      )}
      <CardContent className={(displayImageUrl || memory.id === "traditional-day-memory") ? "p-6" : "p-6 pt-6"}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-heading font-semibold text-lg text-gray-800">
            {memory.title}
            {memory.featured && (
              <span className="ml-2 inline-block">
                <Star className="h-4 w-4 inline text-amber-400 fill-amber-400" />
              </span>
            )}
          </h3>
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>
        <p className="text-gray-600 mb-4 line-clamp-3">{memory.content}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-3">
              {memory.author.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-gray-700">{memory.author}</span>
          </div>
          
          {memory.featured && (
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-amber-400" />
              ))}
            </div>
          )}
        </div>
        
        {/* Reactions section */}
        <MemoryReactions 
          memory={memory} 
          onReactionAdded={onReactionAdded} 
        />
      </CardContent>
    </Card>
  );
}
