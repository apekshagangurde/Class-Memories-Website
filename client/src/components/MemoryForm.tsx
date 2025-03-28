import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImage, addMemory } from '../lib/firebase';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  content: z.string().min(1, "Content is required").max(1000, "Content is too long"),
  author: z.string().min(1, "Name is required").max(50, "Name is too long"),
});

interface MemoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryAdded: () => void;
}

type FormValues = z.infer<typeof formSchema>;

const MemoryForm: React.FC<MemoryFormProps> = ({ isOpen, onClose, onMemoryAdded }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      author: '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (15MB limit)
      if (file.size > 15 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 15MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // Ensure we're in submitting state
      setIsSubmitting(true);
      
      // Save form data for use after form is closed
      const memoryData = {
        title: data.title,
        content: data.content,
        author: data.author,
      };
      
      // Show processing notification
      toast({
        title: "Processing...",
        description: "Saving your memory",
        duration: 5000
      });
      
      // IMPORTANT: Start Firebase operations BEFORE closing the form
      let uploadPromise: Promise<string | undefined> = Promise.resolve(undefined);
      
      // Start image upload if we have an image - but don't wait for completion
      if (selectedImage) {
        console.log("Starting image upload for", selectedImage.name);
        uploadPromise = uploadImage(selectedImage)
          .catch(err => {
            console.error("Upload error:", err);
            return undefined;
          });
      }
      
      // Close the form for better UX 
      form.reset();
      removeImage();
      onClose();
      
      // Now wait for the image upload to complete
      console.log("Waiting for image upload to complete...");
      const imageUrl = await uploadPromise;
      console.log("Image upload finished, got URL:", imageUrl ? "Yes" : "No");
      
      // Now save the memory to Firebase
      console.log("Adding memory to Firebase...");
      const memoryId = await addMemory({
        ...memoryData,
        imageUrl,
      });
      console.log("Memory added with ID:", memoryId);
      
      // Trigger UI refresh explicitly - use a small delay to ensure Firebase has time to update
      setTimeout(() => {
        console.log("Calling onMemoryAdded to refresh the memory grid");
        onMemoryAdded();
      }, 500);
      
      // Show success notification
      toast({
        title: "Success!",
        description: "Your memory has been saved",
        duration: 3000
      });
      
    } catch (error) {
      console.error("Error submitting memory:", error);
      toast({
        title: "Error",
        description: "Failed to share your memory. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold text-gray-800">Share Your Memory</DialogTitle>
          <DialogDescription className="text-gray-600">
            Images must be under 15MB in size. Large images will be automatically optimized.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="What's this memory about?" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Memory</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your story..." 
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <Label>Add Photo (optional)</Label>
              <div 
                onClick={handleDropZoneClick}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition cursor-pointer"
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
                
                {imagePreview ? (
                  <div className="space-y-2">
                    <img 
                      src={imagePreview} 
                      alt="Memory preview" 
                      className="mx-auto max-h-48 object-contain" 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Click to upload an image or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF up to 15MB (images will be optimized)</p>
                  </div>
                )}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="How should we credit you?" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="sticky bottom-0 bg-white py-4 border-t mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Sharing...
                  </span>
                ) : "Share Memory"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MemoryForm;
