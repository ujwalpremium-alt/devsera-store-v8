import { useState } from 'react';
import { useCommunityPosts, CommunityComment } from '@/hooks/useCommunity';
import { useSettings } from '@/hooks/useSettings';
import { mockCommunityPosts } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Send, ExternalLink, Users, ChevronDown, ChevronUp, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export function CommunityPage() {
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loadedComments, setLoadedComments] = useState<Record<string, CommunityComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();
  const { posts: dbPosts, isLoading, createPost, toggleLike, addComment, loadComments, userLikes } = useCommunityPosts();
  const { settings } = useSettings();

  // Use mock data if Supabase is not configured
  const posts = isSupabaseConfigured && dbPosts.length > 0 ? dbPosts : mockCommunityPosts;

  const handleJoinChannel = () => {
    if (settings?.telegramLink) {
      window.open(settings.telegramLink, '_blank');
    } else {
      toast({
        title: 'Channel not configured',
        description: 'Please contact admin to set up the community channel.',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured) {
        await createPost(newPost);
      }
      toast({
        title: 'Post created!',
        description: 'Your post has been shared with the community.',
      });
      setNewPost('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to like posts',
        variant: 'destructive',
      });
      return;
    }

    try {
      await toggleLike(postId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedComments.has(postId)) {
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      setExpandedComments(prev => new Set(prev).add(postId));
      
      // Load comments if not already loaded
      if (!loadedComments[postId]) {
        setLoadingComments(prev => new Set(prev).add(postId));
        try {
          const comments = await loadComments(postId);
          setLoadedComments(prev => ({ ...prev, [postId]: comments }));
        } catch (error) {
          console.error('Error loading comments:', error);
        } finally {
          setLoadingComments(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
        }
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to comment',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addComment(postId, content);
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      // Reload comments
      const comments = await loadComments(postId);
      setLoadedComments(prev => ({ ...prev, [postId]: comments }));
      toast({
        title: 'Comment added!',
        description: 'Your comment has been posted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading community posts...</p>
        </div>
      </div>
    );
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  Community
                </h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400 ml-15">
                Share your experiences and connect with other users
              </p>
            </div>
            <Button
              onClick={handleJoinChannel}
              className="rounded-xl bg-[#0088cc] text-white hover:bg-[#0077b5] shadow-lg shadow-[#0088cc]/25 font-semibold px-6"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Telegram
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-6 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Posts</p>
                <p className="font-bold text-gray-900 dark:text-white">{posts.length}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Heart className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Likes</p>
                <p className="font-bold text-gray-900 dark:text-white">{posts.reduce((sum, p) => sum + p.likes, 0)}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Comments</p>
                <p className="font-bold text-gray-900 dark:text-white">{posts.reduce((sum, p) => sum + p.comments, 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Post */}
        {user ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Share your experience</h3>
            </div>
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 border-2 border-teal-100 dark:border-teal-900 ring-2 ring-teal-500/20">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="What's on your mind? Share tips, reviews, or experiences..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl min-h-[100px] resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-gray-50 dark:bg-gray-900"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">{newPost.length}/500 characters</p>
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPost.trim() || isSubmitting || newPost.length > 500}
                    className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25 px-6"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-2xl border border-teal-200 dark:border-teal-800 p-8 mb-8 text-center">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4 font-medium">Login to share your experience with the community</p>
            <Button
              onClick={() => window.location.href = '/login'}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25"
            >
              Login to Post
            </Button>
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map(post => {
            const hasLiked = userLikes?.has(post.id) || (post as any).hasLiked;
            const isExpanded = expandedComments.has(post.id);
            const comments = loadedComments[post.id] || [];
            const isLoadingComments = loadingComments.has(post.id);

            return (
              <div 
                key={post.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800 transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border-2 border-gray-100 dark:border-gray-700 ring-2 ring-gray-100 dark:ring-gray-700">
                      <AvatarImage src={post.userAvatar} />
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold">
                        {post.userName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-gray-900 dark:text-white">{post.userName}</p>
                        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs">{formatTimeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        hasLiked 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-500' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <Heart className={`h-5 w-5 transition-transform hover:scale-110 ${hasLiked ? 'fill-current' : ''}`} />
                      <span className="font-semibold">{post.likes}</span>
                    </button>
                    <button 
                      onClick={() => handleToggleComments(post.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        isExpanded 
                          ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <MessageCircle className="h-5 w-5 transition-transform hover:scale-110" />
                      <span className="font-semibold">{post.comments}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {isExpanded && (
                  <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                    {isLoadingComments ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        {/* Comments List */}
                        {comments.length > 0 ? (
                          <div className="space-y-4 mb-4">
                            {comments.map(comment => (
                              <div key={comment.id} className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
                                  <AvatarImage src={comment.userAvatar} />
                                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs">
                                    {comment.userName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{comment.userName}</p>
                                    <span className="text-xs text-gray-400">{formatTimeAgo(comment.createdAt)}</span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-400 dark:text-gray-500 py-4 text-sm">No comments yet. Be the first to comment!</p>
                        )}

                        {/* Add Comment */}
                        {user ? (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-xs">
                                {user.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                              <Input
                                placeholder="Write a comment..."
                                value={commentInputs[post.id] || ''}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                className="flex-1 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-teal-500 bg-white dark:bg-gray-800"
                              />
                              <Button
                                onClick={() => handleAddComment(post.id)}
                                disabled={!commentInputs[post.id]?.trim()}
                                size="sm"
                                className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-center text-gray-400 dark:text-gray-500 text-sm">
                            <button onClick={() => window.location.href = '/login'} className="text-teal-500 hover:underline">Login</button> to comment
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {posts.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No posts yet</h3>
            <p className="text-gray-500 dark:text-gray-400">Be the first to share something with the community!</p>
          </div>
        )}
      </div>
    </div>
  );
}
