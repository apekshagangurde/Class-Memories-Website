import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, startAfter, DocumentData, QueryDocumentSnapshot, deleteDoc, doc, runTransaction } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from 'browser-image-compression';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyByap2Fp2yQ8NC4eYrUkWO68h9ajYDkp1s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "be2025-46116.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "be2025-46116",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "be2025-46116.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "381743137482",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:381743137482:web:e332f957b3d043c67b6a33",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-81BCCT70MR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Available reaction types
export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad';

// User reaction structure
export interface Reaction {
  type: ReactionType;
  count: number;
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  author: string;
  imageUrl?: string;
  createdAt: Date;
  featured?: boolean; // Flag for 5-star memories
  reactions?: Record<ReactionType, number>; // Counts of each reaction type
}

const MEMORIES_PER_PAGE = 8;

// New approach: Convert image to base64 and store directly in Firestore
// This avoids Firebase Storage issues
export async function uploadImage(file: File): Promise<string> {
  try {
    console.log("Starting image processing (base64 approach)...");
    
    // Compress the image first for smaller storage size
    const fileSizeMB = file.size / 1024 / 1024;
    console.log(`Original image size: ${fileSizeMB.toFixed(2)}MB`);
    
    // Always compress images to keep Firestore document size reasonable
    const options = {
      maxSizeMB: 0.1,             // Ultra tiny (100KB target) - Firestore has 1MB document limit
      maxWidthOrHeight: 800,      // Limit dimensions
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.5,
    };

    console.time('Compression time');
    const compressedFile = await imageCompression(file, options);
    console.timeEnd('Compression time');
    
    const compressedSizeMB = compressedFile.size / 1024 / 1024;
    console.log(`Compression successful - Original: ${fileSizeMB.toFixed(2)}MB → Compressed: ${compressedSizeMB.toFixed(2)}MB`);
    
    // Convert the compressed file to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64String = reader.result;
          console.log(`Base64 conversion successful, length: ${base64String.length} chars`);
          
          // Make sure we're under Firestore's document size limit (1MB)
          if (base64String.length > 750000) {
            // If still too large, we need to compress more aggressively
            console.log("Image still too large for Firestore, applying more compression");
            
            // Create an image element to further resize
            const img = new Image();
            img.onload = () => {
              // Create a canvas to resize the image
              const canvas = document.createElement('canvas');
              // Scale down more if needed
              let width = img.width;
              let height = img.height;
              
              // Keep aspect ratio but limit size further
              const maxDimension = 600;
              if (width > height && width > maxDimension) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else if (height > maxDimension) {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
              
              canvas.width = width;
              canvas.height = height;
              
              // Draw and export with lower quality
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              
              // Get the data URL with lower quality
              const reducedBase64 = canvas.toDataURL('image/jpeg', 0.3);
              console.log(`Further compressed base64 length: ${reducedBase64.length} chars`);
              
              resolve(reducedBase64);
            };
            
            img.src = base64String;
          } else {
            resolve(base64String);
          }
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error("Error in image processing:", error);
    throw new Error("Failed to process image: " + (error instanceof Error ? error.message : String(error)));
  }
}

// Function to add a memory to Firestore
export async function addMemory(memory: {
  title: string;
  content: string;
  author: string;
  imageUrl?: string;
}): Promise<string> {
  console.log("Adding memory to Firestore with data:", JSON.stringify({
    title: memory.title,
    content: memory.content, 
    author: memory.author,
    imageUrl: memory.imageUrl ? "[Image URL exists]" : undefined
  }, null, 2));
  
  // Determine if this should be a featured (5-star) memory based on content quality
  // Check for longer, more detailed content, presence of an image, and descriptive title
  const hasImage = !!memory.imageUrl;
  const contentLength = memory.content.length;
  const isTitleDescriptive = memory.title.length > 15;
  const hasSubstantiveContent = contentLength > 80;
  
  // Featured if it has both an image and substantial content
  const featured = hasImage && hasSubstantiveContent && isTitleDescriptive;
  
  // Make sure we sanitize the data properly
  const memoryToSave = {
    title: memory.title || "",
    content: memory.content || "",
    author: memory.author || "",
    createdAt: new Date(),
    featured, // Add the featured flag
    // Only include imageUrl if it's defined and not empty
    ...(memory.imageUrl ? { imageUrl: memory.imageUrl } : {})
  };
  
  try {
    const docRef = await addDoc(collection(db, "memories"), memoryToSave);
    console.log("Successfully saved memory with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error in addMemory:", error);
    throw error;
  }
}

// Function to fetch memories with pagination
export async function getMemories(
  lastVisible?: QueryDocumentSnapshot<DocumentData> | null
): Promise<{ memories: Memory[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
  try {
    let memoriesQuery;
    
    if (lastVisible) {
      memoriesQuery = query(
        collection(db, "memories"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(MEMORIES_PER_PAGE)
      );
    } else {
      memoriesQuery = query(
        collection(db, "memories"),
        orderBy("createdAt", "desc"),
        limit(MEMORIES_PER_PAGE)
      );
    }
    
    const snapshot = await getDocs(memoriesQuery);
    
    const memories: Memory[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        author: data.author,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt.toDate(),
        featured: data.featured || false,
        reactions: data.reactions || {
          like: 0,
          love: 0,
          laugh: 0,
          wow: 0,
          sad: 0
        }
      };
    });
    
    const newLastVisible = snapshot.docs.length > 0 
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;
      
    return { 
      memories,
      lastVisible: newLastVisible
    };
  } catch (error) {
    console.error("Error fetching memories:", error);
    throw error;
  }
}

// Function to clear all existing memories and add a new one about traditional day
export async function clearAndAddTraditionalDayMemory(): Promise<void> {
  try {
    // 1. Delete all existing memories
    const allMemoriesQuery = query(collection(db, "memories"));
    const snapshot = await getDocs(allMemoriesQuery);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // 2. Add the new memory about traditional day with Apeksha as author
    await addMemory({
      title: "Traditional Day Celebration",
      content: "We celebrated our cultural heritage with a vibrant Traditional Day event. Everyone dressed in their traditional attire, showcasing the diverse cultural backgrounds of our class. The day was filled with performances, traditional food, and lots of photos to capture the memories.",
      author: "Apeksha",
      imageUrl: "https://images.unsplash.com/photo-1565035010268-a3816f98589a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" // Will be replaced with a local image in the UI
    });
    
    console.log("Successfully cleared memories and added traditional day memory");
  } catch (error) {
    console.error("Error in clearAndAddTraditionalDayMemory:", error);
    throw error;
  }
}

// Store user reactions in local storage to limit one reaction per memory
const USER_REACTIONS_KEY = 'user_memory_reactions';

// Function to get user's reactions from localStorage
function getUserReactions(): Record<string, ReactionType> {
  const stored = localStorage.getItem(USER_REACTIONS_KEY);
  return stored ? JSON.parse(stored) : {};
}

// Function to save user's reaction to localStorage
function saveUserReaction(memoryId: string, reactionType: ReactionType): void {
  const userReactions = getUserReactions();
  userReactions[memoryId] = reactionType;
  localStorage.setItem(USER_REACTIONS_KEY, JSON.stringify(userReactions));
}

// Function to get user's previous reaction for a memory, if any
export function getUserReactionForMemory(memoryId: string): ReactionType | null {
  const userReactions = getUserReactions();
  return userReactions[memoryId] || null;
}

// Function to add a reaction to a memory
export async function addReaction(memoryId: string, reactionType: ReactionType): Promise<void> {
  try {
    console.log(`Adding ${reactionType} reaction to memory: ${memoryId}`);
    
    // Get the memory document reference
    const memoryRef = doc(db, "memories", memoryId);
    
    // Get the user's previous reaction, if any
    const previousReaction = getUserReactionForMemory(memoryId);
    
    // Use a transaction to ensure we're updating the correct count atomically
    await runTransaction(db, async (transaction) => {
      const memoryDoc = await transaction.get(memoryRef);
      
      if (!memoryDoc.exists()) {
        throw new Error("Memory does not exist!");
      }
      
      // Get current reactions or initialize if they don't exist
      const memoryData = memoryDoc.data();
      const currentReactions = memoryData.reactions || {
        like: 0,
        love: 0,
        laugh: 0,
        wow: 0,
        sad: 0
      };
      
      // Create a copy of current reactions
      const updatedReactions = { ...currentReactions };
      
      // If user had a previous reaction, decrement it
      if (previousReaction && previousReaction !== reactionType) {
        updatedReactions[previousReaction] = Math.max(0, (currentReactions[previousReaction] || 0) - 1);
      }
      
      // Only increment if this is a new reaction or different from previous
      if (!previousReaction || previousReaction !== reactionType) {
        updatedReactions[reactionType] = (currentReactions[reactionType] || 0) + 1;
        
        // Save the user's new reaction
        saveUserReaction(memoryId, reactionType);
      } else {
        // If it's the same reaction, remove it (toggle behavior)
        updatedReactions[reactionType] = Math.max(0, (currentReactions[reactionType] || 0) - 1);
        
        // Remove from local storage
        const userReactions = getUserReactions();
        delete userReactions[memoryId];
        localStorage.setItem(USER_REACTIONS_KEY, JSON.stringify(userReactions));
      }
      
      // Update the memory document
      transaction.update(memoryRef, { reactions: updatedReactions });
    });
    
    console.log(`Successfully processed ${reactionType} reaction for memory: ${memoryId}`);
  } catch (error) {
    console.error("Error processing reaction:", error);
    throw error;
  }
}

export { db };
