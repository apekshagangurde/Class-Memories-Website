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

// Function to upload an image to Firebase Storage with compression
export async function uploadImage(file: File): Promise<string> {
  try {
    // Compression options
    const options = {
      maxSizeMB: 1,             // Max size after compression
      maxWidthOrHeight: 1920,   // Limit width/height while maintaining aspect ratio
      useWebWorker: true,       // Use web worker for faster compression
      fileType: file.type,      // Preserve original file type
    };

    // Compress the image
    const compressedFile = await imageCompression(file, options);
    
    // Generate a unique filename
    const storageRef = ref(storage, `memory_images/${Date.now()}_${file.name}`);
    
    // Upload the compressed file
    const snapshot = await uploadBytes(storageRef, compressedFile);
    
    // Return the download URL
    return getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Error compressing/uploading image:", error);
    
    // Fallback to original file if compression fails
    console.log("Falling back to original file upload");
    const storageRef = ref(storage, `memory_images/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  }
}

// Function to add a memory to Firestore
export async function addMemory(memory: Omit<Memory, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, "memories"), {
    ...memory,
    createdAt: new Date()
  });
  return docRef.id;
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
