import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { type Memory } from '../lib/firebase';
import traditionalDayImage from '../assets/traditional_day.jpg';

interface MemoryCardProps {
  memory: Memory;
  onImageClick: (imageUrl: string) => void;
}

export default function MemoryCard({ memory, onImageClick }: MemoryCardProps) {
  const formattedDate = format(memory.createdAt, 'PPP');
  
  // Use the local traditional day image when the author is Apeksha
  const displayImageUrl = memory.author === "Apeksha" ? traditionalDayImage : memory.imageUrl;
  
  return (
    <Card className="memory-card overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      {(memory.imageUrl || memory.author === "Apeksha") && (
        <div className="relative h-56 overflow-hidden">
          <img 
            src={displayImageUrl} 
            alt={`Memory: ${memory.title}`} 
            className="w-full h-full object-cover cursor-pointer" 
            onClick={() => onImageClick(displayImageUrl!)}
          />
        </div>
      )}
      <CardContent className={(memory.imageUrl || memory.author === "Apeksha") ? "p-6" : "p-6 pt-6"}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-heading font-semibold text-lg text-gray-800">{memory.title}</h3>
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>
        <p className="text-gray-600 mb-4">{memory.content}</p>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-3">
            {memory.author.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-gray-700">{memory.author}</span>
        </div>
      </CardContent>
    </Card>
  );
}
