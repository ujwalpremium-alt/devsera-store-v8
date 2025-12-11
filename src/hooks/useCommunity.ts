import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CommunityPost } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { mockCommunityPosts } from '@/data/mockData';

export function useCommunityPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    if (!isSupabaseConfigured) {
      setPosts(mockCommunityPosts);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profile:profiles(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts(
        data.map((p) => ({
          id: p.id,
          userId: p.user_id,
          userName: p.profile?.name || 'Anonymous',
          userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.profile?.name}`,
          content: p.content,
          likes: p.likes,
          comments: p.comments,
          createdAt: p.created_at,
        }))
      );
    } catch (err) {
      setError(err as Error);
      // Fallback to mock data on error
      setPosts(mockCommunityPosts);
    } finally {
      setIsLoading(false);
    }
  };

  const createPost = async (content: string) => {
    if (!user) throw new Error('User not authenticated');

    if (!isSupabaseConfigured) {
      // Add to local state for mock mode
      const newPost: CommunityPost = {
        id: `POST-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
        content,
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
      };
      setPosts([newPost, ...posts]);
      return;
    }

    const { error } = await supabase
      .from('community_posts')
      .insert({
        user_id: user.id,
        content,
      });

    if (error) throw error;
    await loadPosts();
  };

  const likePost = async (postId: string) => {
    if (!isSupabaseConfigured) {
      // Update local state for mock mode
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      ));
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const { error } = await supabase
      .from('community_posts')
      .update({ likes: post.likes + 1 })
      .eq('id', postId);

    if (error) throw error;
    await loadPosts();
  };

  return { posts, isLoading, error, refetch: loadPosts, createPost, likePost };
}
