import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CommunityPost } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { mockCommunityPosts } from '@/data/mockData';

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface ExtendedCommunityPost extends CommunityPost {
  hasLiked?: boolean;
  commentsList?: CommunityComment[];
}

export function useCommunityPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ExtendedCommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPosts();
  }, [user]);

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

      // Load user's likes if logged in
      let likedPostIds = new Set<string>();
      if (user) {
        const { data: likesData } = await supabase
          .from('community_likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        if (likesData) {
          likedPostIds = new Set(likesData.map(l => l.post_id));
        }
      }
      setUserLikes(likedPostIds);

      setPosts(
        data.map((p) => ({
          id: p.id,
          userId: p.user_id,
          userName: p.profile?.name || 'Anonymous',
          userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.profile?.name}`,
          content: p.content,
          likes: p.likes || 0,
          comments: p.comments || 0,
          createdAt: p.created_at,
          hasLiked: likedPostIds.has(p.id),
        }))
      );
    } catch (err) {
      setError(err as Error);
      setPosts(mockCommunityPosts);
    } finally {
      setIsLoading(false);
    }
  };

  const createPost = async (content: string) => {
    if (!user) throw new Error('User not authenticated');

    if (!isSupabaseConfigured) {
      const newPost: ExtendedCommunityPost = {
        id: `POST-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
        content,
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
        hasLiked: false,
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

  const toggleLike = async (postId: string) => {
    if (!user) throw new Error('Please login to like posts');

    if (!isSupabaseConfigured) {
      setPosts(posts.map(p => {
        if (p.id === postId) {
          const hasLiked = !p.hasLiked;
          return { ...p, likes: hasLiked ? p.likes + 1 : p.likes - 1, hasLiked };
        }
        return p;
      }));
      return;
    }

    const hasLiked = userLikes.has(postId);

    if (hasLiked) {
      // Unlike
      const { error } = await supabase
        .from('community_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setUserLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      // Like
      const { error } = await supabase
        .from('community_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) throw error;
      
      setUserLikes(prev => new Set(prev).add(postId));
    }

    await loadPosts();
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) throw new Error('Please login to comment');

    if (!isSupabaseConfigured) {
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, comments: p.comments + 1 } : p
      ));
      return;
    }

    const { error } = await supabase
      .from('community_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
      });

    if (error) throw error;
    await loadPosts();
  };

  const loadComments = async (postId: string): Promise<CommunityComment[]> => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('community_comments')
      .select(`
        *,
        profile:profiles(name, email)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(c => ({
      id: c.id,
      postId: c.post_id,
      userId: c.user_id,
      userName: c.profile?.name || 'Anonymous',
      userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.profile?.name}`,
      content: c.content,
      createdAt: c.created_at,
    }));
  };

  const deleteComment = async (commentId: string) => {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('community_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    await loadPosts();
  };

  // Legacy function for backward compatibility
  const likePost = toggleLike;

  return { 
    posts, 
    isLoading, 
    error, 
    refetch: loadPosts, 
    createPost, 
    likePost,
    toggleLike,
    addComment,
    loadComments,
    deleteComment,
    userLikes,
  };
}
