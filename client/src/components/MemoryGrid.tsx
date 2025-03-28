import React, { useState, useEffect } from 'react';
import MemoryCard from './MemoryCard';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import MemoryForm from './MemoryForm';
import ImageLightbox from './ImageLightbox';
import { getMemories, type Memory, clearAndAddTraditionalDayMemory } from '../lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

const MemoryGrid: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isMemoryFormOpen, setIsMemoryFormOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchMemories = async (isInitial = false) => {
    try {
      setIsLoading(true);
      
      // Try to fetch from Firebase, but we'll have a fallback for errors
      try {
        const lastDoc = isInitial ? undefined : (lastVisible || undefined);
        const result = await getMemories(lastDoc);
        
        if (isInitial) {
          if (result.memories.length === 0) {
            createTraditionalDayMemory();
          } else {
            setMemories(result.memories);
          }
        } else {
          setMemories(prev => [...prev, ...result.memories]);
        }
        
        setLastVisible(result.lastVisible);
        setHasMore(!!result.lastVisible && result.memories.length > 0);
      } catch (firebaseError) {
        console.error("Error fetching memories from Firebase:", firebaseError);
        
        // If Firebase fails and this is initial load, create a hardcoded memory
        if (isInitial) {
          createTraditionalDayMemory();
          
          // No more memories to load after this
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Critical error in fetchMemories:", error);
      toast({
        title: "Error",
        description: "Failed to load memories. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to create the traditional day memory
  const createTraditionalDayMemory = () => {
    const traditionalDayMemory: Memory = {
      id: "traditional-day-memory",
      title: "Our Class Photo at K. K. Wagh Institute",
      content: "This is a photo of our BE2025 class at K. K. Wagh Institute of Engineering Education and Research. We've had so many wonderful memories together during our time at the institute. This photo was taken at the entrance of our college building.",
      author: "Apeksha",
      createdAt: new Date(),
      // We'll handle the actual image in the MemoryCard component
      imageUrl: "placeholder-for-traditional-day"
    };
    setMemories([traditionalDayMemory]);
  };

  useEffect(() => {
    // Instead of clearing Firebase (which requires admin privileges),
    // just fetch memories and then handle the Traditional Day memory in the UI
    fetchMemories(true);
  }, []);

  const handleLoadMore = () => {
    fetchMemories();
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseLightbox = () => {
    setSelectedImage(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-heading font-bold text-gray-800">Our Shared Memories</h2>
          <p className="text-gray-600 mt-2">Explore memories from our time together at BE2025</p>
        </div>
        
        <Button 
          className="mt-4 md:mt-0 bg-secondary hover:bg-amber-600 text-white"
          onClick={() => setIsMemoryFormOpen(true)}
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Memory
        </Button>
      </div>
      
      {memories.length === 0 && !isLoading ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No memories yet</h3>
          <p className="text-gray-500 mb-6">Be the first to share a class memory!</p>
          <Button 
            onClick={() => setIsMemoryFormOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Share a Memory
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {memories.map((memory) => (
              <MemoryCard 
                key={memory.id} 
                memory={memory} 
                onImageClick={handleImageClick}
              />
            ))}
          </div>
          
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                className="px-6 py-2 text-primary border-primary"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load More Memories"}
              </Button>
            </div>
          )}
        </>
      )}

      <MemoryForm 
        isOpen={isMemoryFormOpen} 
        onClose={() => setIsMemoryFormOpen(false)} 
        onMemoryAdded={() => fetchMemories(true)}
      />
      
      <ImageLightbox 
        isOpen={!!selectedImage} 
        imageUrl={selectedImage} 
        onClose={handleCloseLightbox} 
      />
    </div>
  );
};

export default MemoryGrid;
