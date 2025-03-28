import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, startAfter, DocumentData, QueryDocumentSnapshot, deleteDoc, doc } from "firebase/firestore";
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

export interface Memory {
  id: string;
  title: string;
  content: string;
  author: string;
  imageUrl?: string;
  createdAt: Date;
}

const MEMORIES_PER_PAGE = 8;

// Function to upload an image to Firebase Storage with extreme compression for almost instant uploads
export async function uploadImage(file: File): Promise<string> {
  try {
    console.log("Starting image upload process...");
    
    // Set a size threshold - tiny images don't need compression
    const SIZE_THRESHOLD_MB = 0.3; // 300KB
    const fileSizeMB = file.size / 1024 / 1024;
    
    // Start by preparing the filename - we'll need it regardless of compression path
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeFileName = file.name.replace(/[^a-z0-9]/gi, '_').substring(0, 20); // Limit filename length, remove special chars
    const filename = `memory_images/${timestamp}_${safeFileName}.${fileExtension}`;
    
    console.log(`Preparing to upload file: ${filename}, Original size: ${fileSizeMB.toFixed(2)}MB`);
    
    let fileToUpload: File | Blob = file;
    let finalFilename = filename;
    
    // For larger files, compress them
    if (fileSizeMB > SIZE_THRESHOLD_MB) {
      try {
        // For larger files, use ultra compression settings
        const options = {
          maxSizeMB: 0.1,             // Ultra tiny (100KB target)
          maxWidthOrHeight: 800,      // Small enough for web viewing
          useWebWorker: true,         // Parallel processing
          fileType: 'image/jpeg',     // Always convert to JPEG
          alwaysKeepResolution: false,
          initialQuality: 0.5,        // Slightly higher quality for better images
        };

        // Compress the image
        console.time('Compression time');
        const compressedFile = await imageCompression(file, options);
        console.timeEnd('Compression time');
        
        console.log(`Compression successful - Original: ${fileSizeMB.toFixed(2)}MB → Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        
        fileToUpload = compressedFile;
        finalFilename = `memory_images/${timestamp}_compressed.jpg`; // Always use jpg for compressed files
      } catch (compressionError) {
        console.error("Image compression failed:", compressionError);
        console.log("Will try to upload original file instead");
      }
    } else {
      console.log(`File already small (${fileSizeMB.toFixed(2)}MB), skipping compression`);
    }
    
    // Upload the file (either compressed or original)
    console.log(`Uploading to Firebase Storage: ${finalFilename}`);
    const storageRef = ref(storage, finalFilename);
    
    try {
      const metadata = {
        contentType: fileToUpload.type || 'image/jpeg',
        customMetadata: {
          originalSize: `${fileSizeMB.toFixed(2)}MB`,
          originalName: file.name
        }
      };
      
      const snapshot = await uploadBytes(storageRef, fileToUpload, metadata);
      console.log("Upload successful, getting download URL...");
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log("Got download URL:", downloadURL.substring(0, 50) + "...");
      return downloadURL;
    } catch (uploadError) {
      console.error("Error uploading to Firebase Storage:", uploadError);
      
      // Try one more time with a simplified approach
      console.log("Attempting fallback upload with minimal metadata");
      const fallbackRef = ref(storage, `memory_images/fallback_${timestamp}.jpg`);
      const fallbackSnapshot = await uploadBytes(fallbackRef, fileToUpload);
      return getDownloadURL(fallbackSnapshot.ref);
    }
  } catch (error) {
    console.error("Fatal error in image upload process:", error);
    throw new Error("Could not upload image after multiple attempts: " + (error instanceof Error ? error.message : String(error)));
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
  
  // Make sure we sanitize the data properly
  const memoryToSave = {
    title: memory.title || "",
    content: memory.content || "",
    author: memory.author || "",
    createdAt: new Date(),
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
        createdAt: data.createdAt.toDate()
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

export { db };
