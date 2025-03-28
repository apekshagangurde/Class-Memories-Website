import React, { useState, useEffect, useRef } from 'react';
import MemoryCard from './MemoryCard';
import { Button } from '@/components/ui/button';
import { PlusCircle, Play, LayoutGrid } from 'lucide-react';
import MemoryForm from './MemoryForm';
import ImageLightbox from './ImageLightbox';
import MemoryStories from './MemoryStories';
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
  const [refetchCounter, setRefetchCounter] = useState(0);
  const [reactionsCounter, setReactionsCounter] = useState(0);
  const [isStoriesMode, setIsStoriesMode] = useState(false);
  const [viewingStories, setViewingStories] = useState(false);
  const { toast } = useToast();

  const fetchMemories = async (isInitial = false) => {
    try {
      console.log("Fetching memories, isInitial:", isInitial);
      setIsLoading(true);
      
      // Try to fetch from Firebase, but we'll have a fallback for errors
      try {
        const lastDoc = isInitial ? undefined : (lastVisible || undefined);
        console.log("Calling getMemories with lastDoc:", lastDoc ? "exists" : "undefined");
        const result = await getMemories(lastDoc);
        console.log(`Fetched ${result.memories.length} memories from Firebase`);
        
        if (isInitial) {
          if (result.memories.length === 0) {
            console.log("No memories found, creating traditional day memory");
            createTraditionalDayMemory();
          } else {
            console.log("Setting initial memories:", result.memories.length);
            setMemories(result.memories);
          }
        } else {
          console.log("Adding more memories to existing list");
          setMemories(prev => [...prev, ...result.memories]);
        }
        
        setLastVisible(result.lastVisible);
        setHasMore(!!result.lastVisible && result.memories.length > 0);
        console.log("Has more memories:", !!result.lastVisible && result.memories.length > 0);
      } catch (firebaseError) {
        console.error("Error fetching memories from Firebase:", firebaseError);
        
        // If Firebase fails and this is initial load, create a hardcoded memory
        if (isInitial) {
          console.log("Firebase error on initial load, creating fallback memory");
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
      imageUrl: "placeholder-for-traditional-day",
      featured: true // Make this a featured memory
    };
    setMemories([traditionalDayMemory]);
  };

  useEffect(() => {
    // Fetch memories whenever the refetchCounter changes
    console.log("Refetching memories due to counter change:", refetchCounter);
    
    // Reset the pagination and start fresh
    setLastVisible(null);
    setHasMore(true);
    
    // Instead of clearing Firebase (which requires admin privileges),
    // just fetch memories and then handle the Traditional Day memory in the UI
    fetchMemories(true);
  }, [refetchCounter]);
  
  // Effect to refresh memories when a reaction is added
  useEffect(() => {
    if (reactionsCounter > 0) {
      console.log("Refreshing memories due to reaction update");
      fetchMemories(true);
    }
  }, [reactionsCounter]);

  const handleLoadMore = () => {
    fetchMemories();
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseLightbox = () => {
    setSelectedImage(null);
  };
  
  const handleReactionAdded = () => {
    setReactionsCounter(prev => prev + 1);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-heading font-bold text-gray-800">Our Shared Memories</h2>
          <p className="text-gray-600 mt-2">Explore memories from our time together at BE2025</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          {/* View Mode Toggle */}
          <div className="bg-gray-100 rounded-full p-1 flex">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full px-3 ${!isStoriesMode ? 'bg-white shadow-sm' : 'text-gray-500'}`}
              onClick={() => setIsStoriesMode(false)}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full px-3 ${isStoriesMode ? 'bg-white shadow-sm' : 'text-gray-500'}`}
              onClick={() => setIsStoriesMode(true)}
            >
              <Play className="h-4 w-4 mr-1" />
              Stories
            </Button>
          </div>
          
          {/* View Stories Button - only visible in stories mode */}
          {isStoriesMode && memories.length > 0 && (
            <Button 
              className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white relative overflow-hidden group animate-pulse hover:animate-none shadow-md hover:shadow-rose-400/30"
              onClick={() => setViewingStories(true)}
            >
              <span className="absolute inset-0 w-full h-full">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shine" style={{ transform: 'skewX(-20deg)' }}></span>
              </span>
              <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition-all duration-300" />
              <span className="relative z-10">View Stories</span>
            </Button>
          )}
          
          {/* Add Memory Button with animation */}
          <Button 
            className="bg-secondary hover:bg-amber-600 text-white relative overflow-hidden group animate-pulse hover:animate-none transition-all duration-300 shadow-lg hover:shadow-amber-300/50"
            onClick={() => setIsMemoryFormOpen(true)}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-amber-400 to-amber-300 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
            <PlusCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            <span className="relative z-10">Add Memory</span>
            <span className="absolute bottom-0 left-0 h-1 w-0 bg-white group-hover:w-full transition-all duration-300"></span>
          </Button>
        </div>
      </div>
      
      {memories.length === 0 && !isLoading ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No memories yet</h3>
          <p className="text-gray-500 mb-6">Be the first to share a class memory!</p>
          <Button 
            onClick={() => setIsMemoryFormOpen(true)}
            className="bg-primary hover:bg-primary/90 relative overflow-hidden group animate-bounce hover:animate-none shadow-lg hover:shadow-primary/30"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary-foreground to-primary-foreground opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
            <PlusCircle className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10">Share a Memory</span>
            <span className="absolute bottom-0 left-0 h-1 w-0 bg-white group-hover:w-full transition-all duration-300"></span>
          </Button>
        </div>
      ) : (
        <>
          {isStoriesMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {memories
                .filter(memory => memory.imageUrl) // Only show memories with images in story view
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 8) // Limit to the 8 most recent stories
                .map((memory, index) => (
                  <div 
                    key={memory.id}
                    className="aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden relative cursor-pointer group"
                    onClick={() => {
                      setViewingStories(true);
                    }}
                  >
                    {memory.imageUrl && (
                      <img 
                        src={memory.imageUrl} 
                        alt={memory.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-300 mb-2 flex items-center justify-center text-lg font-bold">
                        {memory.author.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="text-white font-semibold text-base mb-1 line-clamp-1">{memory.title}</h3>
                      <p className="text-white/80 text-xs">{memory.author}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Sort memories so featured ones appear first */}
              {memories
                .sort((a, b) => {
                  // Featured memories appear first
                  if (a.featured && !b.featured) return -1;
                  if (!a.featured && b.featured) return 1;
                  // Then sort by date
                  return b.createdAt.getTime() - a.createdAt.getTime();
                })
                .map((memory) => (
                  <MemoryCard 
                    key={memory.id} 
                    memory={memory} 
                    onImageClick={handleImageClick}
                    onReactionAdded={handleReactionAdded}
                  />
                ))
              }
            </div>
          )}
          
          {!isStoriesMode && hasMore && (
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
      
      {/* Stories Modal */}
      {viewingStories && (
        <MemoryStories 
          memories={memories.filter(memory => memory.imageUrl)} 
          onClose={() => setViewingStories(false)} 
        />
      )}

      <MemoryForm 
        isOpen={isMemoryFormOpen} 
        onClose={() => setIsMemoryFormOpen(false)} 
        onMemoryAdded={() => setRefetchCounter(prev => prev + 1)}
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
