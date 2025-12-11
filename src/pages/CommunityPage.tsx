import { useState } from 'react';
import { useCommunityPosts } from '@/hooks/useCommunity';
import { useSettings } from '@/hooks/useSettings';
import { mockCommunityPosts } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Send, ExternalLink, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export function CommunityPage() {
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { posts: dbPosts, isLoading, createPost, likePost } = useCommunityPosts();
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

  if (isLoading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-amber-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600">Loading community posts...</p>
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Community
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Share your experiences and connect with other users
              </p>
            </div>
            <Button
              onClick={handleJoinChannel}
              className="rounded-xl bg-[#0088cc] text-white hover:bg-[#0077b5] shadow-lg shadow-[#0088cc]/25 font-semibold"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Join Telegram
            </Button>
          </div>
        </div>

        {/* Create Post */}
        {user ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-sm">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 border-2 border-gray-100 dark:border-gray-700">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Share your experience with the community..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl min-h-[100px] resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white dark:bg-gray-900"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPost.trim() || isSubmitting}
                    className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-3">Login to share your experience with the community</p>
            <Button
              onClick={() => window.location.href = '/login'}
              variant="outline"
              className="rounded-xl border-2 border-gray-900 dark:border-gray-300"
            >
              Login to Post
            </Button>
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border-2 border-gray-100 dark:border-gray-700">
                  <AvatarImage src={post.userAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
                    {post.userName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{post.userName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{post.content}</p>
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => likePost(post.id)}
                      className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors group"
                    >
                      <Heart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-teal-600 transition-colors group">
                      <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold">{post.comments}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!user && (
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-2xl p-8 text-center mt-8 border border-teal-100 dark:border-teal-800">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Join the community
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sign up to share your experiences and connect with other users
            </p>
            <Button
              onClick={() => window.location.href = '/register'}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-teal-500/25"
            >
              Sign Up Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
