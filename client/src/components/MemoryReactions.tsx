import React, { useState } from 'react';
import { Heart, ThumbsUp, Laugh, AlertCircle, Frown, Loader2 } from 'lucide-react';
import { addReaction, type Memory, type ReactionType } from '../lib/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ReactionButtonProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  type: ReactionType;
  onClick: (type: ReactionType) => void;
  loading: boolean;
  active?: boolean;
}

const ReactionButton: React.FC<ReactionButtonProps> = ({
  icon,
  count,
  label,
  type,
  onClick,
  loading,
  active
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
        active 
          ? 'bg-primary/10 text-primary hover:bg-primary/20' 
          : 'hover:bg-gray-100'
      }`}
      onClick={() => onClick(type)}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
      ) : (
        <span className="text-gray-500">{icon}</span>
      )}
      <span className="text-xs font-medium">{count}</span>
      <span className="text-xs hidden sm:inline-block">{label}</span>
    </Button>
  );
};

interface MemoryReactionsProps {
  memory: Memory;
  onReactionAdded?: () => void;
}

const MemoryReactions: React.FC<MemoryReactionsProps> = ({ memory, onReactionAdded }) => {
  const [isLoading, setIsLoading] = useState<ReactionType | null>(null);
  const [lastReacted, setLastReacted] = useState<ReactionType | null>(null);
  const { toast } = useToast();

  const reactions = memory.reactions || {
    like: 0,
    love: 0,
    laugh: 0,
    wow: 0, 
    sad: 0
  };

  const handleReaction = async (type: ReactionType) => {
    try {
      setIsLoading(type);
      await addReaction(memory.id, type);
      setLastReacted(type);
      toast({
        description: `You reacted with ${type}!`,
        duration: 2000
      });
      
      // Call the callback if provided
      if (onReactionAdded) {
        onReactionAdded();
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast({
        title: "Error",
        description: "Failed to add reaction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 mt-2">
      <ReactionButton
        icon={<ThumbsUp className="h-4 w-4" />}
        count={reactions.like}
        label="Like"
        type="like"
        onClick={handleReaction}
        loading={isLoading === "like"}
        active={lastReacted === "like"}
      />
      <ReactionButton
        icon={<Heart className="h-4 w-4" />}
        count={reactions.love}
        label="Love"
        type="love"
        onClick={handleReaction}
        loading={isLoading === "love"}
        active={lastReacted === "love"}
      />
      <ReactionButton
        icon={<Laugh className="h-4 w-4" />}
        count={reactions.laugh}
        label="Haha"
        type="laugh"
        onClick={handleReaction}
        loading={isLoading === "laugh"}
        active={lastReacted === "laugh"}
      />
      <ReactionButton
        icon={<AlertCircle className="h-4 w-4" />}
        count={reactions.wow}
        label="Wow"
        type="wow"
        onClick={handleReaction}
        loading={isLoading === "wow"}
        active={lastReacted === "wow"}
      />
      <ReactionButton
        icon={<Frown className="h-4 w-4" />}
        count={reactions.sad}
        label="Sad"
        type="sad"
        onClick={handleReaction}
        loading={isLoading === "sad"}
        active={lastReacted === "sad"}
      />
    </div>
  );
};

export default MemoryReactions;