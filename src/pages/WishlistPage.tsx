import { useNavigate } from 'react-router-dom';
import { useWishlist } from '@/contexts/WishlistContext';
import { useProducts } from '@/hooks/useProducts';
import { mockProducts } from '@/data/mockData';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingBag, Trash2, ArrowRight, Package, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

export function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { products: dbProducts, isLoading } = useProducts();
  
  const products = isSupabaseConfigured && dbProducts.length > 0 ? dbProducts : mockProducts;
  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  const totalValue = wishlistProducts.reduce((sum, p) => sum + (p.salePrice || 0), 0);
  const totalSavings = wishlistProducts.reduce((sum, p) => sum + ((p.originalPrice || 0) - (p.salePrice || 0)), 0);

  if (isLoading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <Heart className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Wishlist</h1>
              <p className="text-pink-100">
                {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Products List */}
            <div className="lg:col-span-2 space-y-4">
              {wishlistProducts.map((product) => {
                const savings = (product.originalPrice || 0) - (product.salePrice || 0);
                const discountPercent = product.originalPrice 
                  ? Math.round((savings / product.originalPrice) * 100) 
                  : 0;

                return (
                  <Card 
                    key={product.id} 
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        <div 
                          className="w-full sm:w-40 h-40 bg-gray-100 dark:bg-gray-700 flex-shrink-0 cursor-pointer"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 
                                  className="font-semibold text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 cursor-pointer transition-colors"
                                  onClick={() => navigate(`/product/${product.id}`)}
                                >
                                  {product.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                  {product.description}
                                </p>
                              </div>
                              {discountPercent > 0 && (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex-shrink-0">
                                  -{discountPercent}%
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-gray-900 dark:text-white">
                                ₹{product.salePrice}
                              </span>
                              {product.originalPrice && product.originalPrice > (product.salePrice || 0) && (
                                <span className="text-sm text-gray-400 line-through">
                                  ₹{product.originalPrice}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromWishlist(product.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => navigate(`/product/${product.id}`)}
                                className="bg-pink-500 hover:bg-pink-600 text-white"
                              >
                                <ShoppingBag className="h-4 w-4 mr-1" />
                                Buy Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Summary Card */}
            <div className="lg:col-span-1">
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 sticky top-4">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-pink-500" />
                    Wishlist Summary
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Items</span>
                      <span className="font-medium text-gray-900 dark:text-white">{wishlistProducts.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Value</span>
                      <span className="font-medium text-gray-900 dark:text-white">₹{totalValue}</span>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total Savings</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">₹{totalSavings}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <Button 
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                      onClick={() => navigate('/')}
                    >
                      Continue Shopping
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                    Items in your wishlist are saved locally and won't expire.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Heart className="h-16 w-16 text-pink-300 dark:text-pink-700" />}
            title="Your wishlist is empty"
            description="Save products you love by clicking the heart icon. They'll appear here for easy access."
            action={
              <Button 
                onClick={() => navigate('/')}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Products
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
