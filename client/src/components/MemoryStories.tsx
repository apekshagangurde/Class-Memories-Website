import React, { useState } from 'react';
import { type Memory } from '../lib/firebase';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface MemoryStoriesProps {
  memories: Memory[];
  onClose: () => void;
}

const MemoryStories: React.FC<MemoryStoriesProps> = ({ memories, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  
  const currentMemory = memories[currentIndex];
  
  const handleNext = () => {
    if (currentIndex < memories.length - 1) {
      setAnimationDirection('left');
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setAnimationDirection(null);
      }, 300);
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setAnimationDirection('right');
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setAnimationDirection(null);
      }, 300);
    }
  };
  
  if (!currentMemory) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
      <Button 
        onClick={onClose}
        variant="ghost" 
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
      >
        <X className="h-6 w-6" />
      </Button>
      
      {/* Story indicators */}
      <div className="absolute top-2 left-0 right-0 flex justify-center space-x-1 px-4">
        {memories.map((_, index) => (
          <div 
            key={index}
            className={`h-1 rounded-full ${
              index === currentIndex 
                ? 'bg-white w-16' 
                : index < currentIndex 
                  ? 'bg-white/70 w-16' 
                  : 'bg-white/30 w-16'
            }`}
          />
        ))}
      </div>
      
      {/* Navigation buttons */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}
      
      {currentIndex < memories.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full"
          onClick={handleNext}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      )}
      
      {/* Story content with animation */}
      <div 
        className={cn(
          "max-w-2xl w-full h-[80vh] bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden shadow-2xl relative transition-transform duration-300",
          {
            "translate-x-full opacity-0": animationDirection === 'right',
            "-translate-x-full opacity-0": animationDirection === 'left',
          }
        )}
      >
        {/* Memory image */}
        {currentMemory.imageUrl && (
          <div className="w-full h-[60%] bg-gray-800">
            <img 
              src={currentMemory.imageUrl} 
              alt={currentMemory.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Memory content */}
        <div className="p-6 text-white h-[40%] overflow-y-auto">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
              {currentMemory.author.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold">{currentMemory.author}</div>
              <div className="text-xs text-gray-300">{format(currentMemory.createdAt, 'PPP')}</div>
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-2">{currentMemory.title}</h3>
          <p className="text-gray-200">{currentMemory.content}</p>
          
          {currentMemory.featured && (
            <div className="mt-4 inline-block px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-300 text-black rounded-full text-sm font-bold">
              ★ 5-Star Memory
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryStories;