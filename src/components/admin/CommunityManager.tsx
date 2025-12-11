import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trash2, 
  MessageSquare, 
  Star, 
  RefreshCw, 
  Heart,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react';
import { useAllReviews } from '@/hooks/useReviews';

interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export function CommunityManager() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const { reviews, isLoading: isLoadingReviews, deleteReview, verifyReview, refetch: refetchReviews } = useAllReviews();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    if (!isSupabaseConfigured) {
      setIsLoadingPosts(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profile:profiles(full_name, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts(
        data.map((p) => ({
          id: p.id,
          userId: p.user_id,
          userName: p.profile?.full_name || p.profile?.name || p.profile?.email?.split('@')[0] || 'Anonymous',
          userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.profile?.full_name || p.profile?.name || p.profile?.email}`,
          content: p.content,
          likes: p.likes,
          comments: p.comments,
          createdAt: p.created_at,
        }))
      );
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!isSupabaseConfigured) {
      setPosts(posts.filter(p => p.id !== postId));
      toast({ title: 'Post deleted' });
      return;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== postId));
      toast({ title: 'Post deleted successfully' });
    } catch (err: any) {
      toast({
        title: 'Error deleting post',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReview(reviewId);
      toast({ title: 'Review deleted successfully' });
    } catch (err: any) {
      toast({
        title: 'Error deleting review',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleVerifyReview = async (reviewId: string, verified: boolean) => {
    try {
      await verifyReview(reviewId, verified);
      toast({ 
        title: verified ? 'Review verified' : 'Review unverified',
        description: verified ? 'This review is now marked as verified' : 'Verification removed'
      });
    } catch (err: any) {
      toast({
        title: 'Error updating review',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

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
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="border-b-2 border-black bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Management
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { loadPosts(); refetchReviews(); }}
              className="border-2 border-black"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="posts" className="space-y-4">
          <TabsList className="border-2 border-black bg-white">
            <TabsTrigger
              value="posts"
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white font-semibold"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Posts ({posts.length})
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white font-semibold"
            >
              <Star className="h-4 w-4 mr-1" />
              Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {isLoadingPosts ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No community posts yet</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-10 w-10 border-2 border-gray-200">
                          <AvatarImage src={post.userAvatar} />
                          <AvatarFallback>{post.userName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{post.userName}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(post.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">{post.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" /> {post.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" /> {post.comments}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {isLoadingReviews ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No product reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-10 w-10 border-2 border-gray-200">
                          <AvatarImage src={review.userAvatar} />
                          <AvatarFallback>{review.userName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold">{review.userName}</span>
                            {review.verified && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(review.createdAt)}</span>
                          </div>
                          {review.productName && (
                            <p className="text-xs text-purple-600 font-medium mb-1">
                              Product: {review.productName}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= review.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">{review.comment}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerifyReview(review.id, !review.verified)}
                          className={review.verified 
                            ? "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-50" 
                            : "text-green-500 hover:text-green-700 hover:bg-green-50"
                          }
                        >
                          {review.verified ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
