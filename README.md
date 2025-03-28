# Class Memories Website - Flow Explanation

## 1. Application Architecture
The application follows a client-server architecture:

- **Frontend:** React with TypeScript, styled with Tailwind CSS and Shadcn UI components.
- **Backend:** Firebase Firestore as the database to store memories and reactions.
- **Storage:** Base64 encoding for image storage directly in Firestore (with compression).

---
## 2. User Experience Flow

### Homepage Loading
- When a user visits the site, the application loads the `Home` component.
- The `Header` component displays with rotating slides (images and slogans).
- The `MemoryGrid` component fetches memories from Firebase.

### Viewing Memories
- Memories are displayed in a responsive grid layout.
- "5-star" featured memories are prioritized at the top of the grid.
- Users can:
  - Click on memory images to view them in a lightbox.
  - Add reactions (like, love, laugh, wow, sad) to memories.
  - Load more memories when scrolling down.

### Adding a Memory
- User clicks the **"Add Memory"** button.
- The `MemoryForm` component opens as a modal.
- User fills out the form with:
  - **Title**
  - **Content (description)**
  - **Author name**
  - **Optional image upload**
- On submission:
  - Image is compressed (if provided).
  - Memory data is sent to Firebase.
  - Success message appears.
  - Grid refreshes to show the new memory.

### Story Mode
- User can toggle between "Grid" and "Stories" view.
- In **Stories view:**
  - Only memories with images are displayed.
  - The layout changes to an Instagram-like stories grid.
  - Clicking **"View Stories"** launches the full-screen story viewer.
  - Users can navigate through stories and exit the viewer.

---
## 3. Technical Flow

### Data Flow
#### User Data Capture:
- Form captures user input.
- Images are optimized through `browser-image-compression` library.
- Form validation ensures quality content.

#### Data Storage:
- Memory data is stored in Firestore.
- Images are encoded as base64 strings within the memory document.
- Reactions are stored as counters for each reaction type.

#### Data Retrieval:
- Memories are fetched in batches (pagination).
- Additional metadata like "featured" is calculated based on content quality.
- User-specific reaction data is stored in `localStorage` to track which reactions a user has given.

### Reaction System
- User clicks a reaction button on a memory.
- The application:
  - Checks if the user already gave a reaction to this memory.
  - If yes and it's the same reaction, removes it (toggle behavior).
  - If yes but a different reaction, updates it.
  - If no, adds the new reaction.
  - Updates the UI immediately while processing the Firebase update.

### Performance Optimizations
#### Image Handling:
- Multi-step compression reduces image size.
- Base64 encoding allows images to be stored directly with memory data.
- Image loading is optimized with proper sizing.

#### Rendering Optimizations:
- Memories are loaded in batches to prevent overwhelming the UI.
- "Load More" functionality prevents loading all memories at once.
- Text content uses line-clamping to maintain consistent card sizes.

---
## 4. User Interface Components

- **Header:** Dynamic slideshow with class images and slogans.
- **MemoryGrid:** Main content area with filtering and display options.
- **MemoryCard:** Individual memory display with title, content, image, and reaction buttons.
- **MemoryForm:** Modal form for submitting new memories.
- **ImageLightbox:** Full-screen image viewer.
- **MemoryStories:** Instagram-style story viewer for immersive browsing.
- **MemoryReactions:** Social reaction system with counters and toggle functionality.

---
## Conclusion
This application provides an interactive platform for users to store and revisit their class memories. Using Firebase for storage and React for a dynamic UI, the app ensures a seamless experience with optimized performance and engaging social features.
