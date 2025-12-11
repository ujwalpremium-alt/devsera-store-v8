import { useNavigate } from 'react-router-dom';
import { useBundles } from '@/hooks/useBundles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Sparkles, Clock, ArrowRight, Percent, Gift } from 'lucide-react';

export function BundleOffersPage() {
  const navigate = useNavigate();
  const { bundles, isLoading } = useBundles();

  const calculateDiscount = (original: number, sale: number) => {
    return Math.round(((original - sale) / original) * 100);
  };

  const formatTimeRemaining = (validUntil: string | null) => {
    if (!validUntil) return null;
    const end = new Date(validUntil);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 md:pb-0">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading bundle offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Gift className="h-4 w-4" />
            Special Bundle Offers
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Save More with <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Bundles</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Get multiple premium subscriptions at unbeatable prices. Limited time offers!
          </p>
        </div>

        {/* Bundles Grid */}
        {bundles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => {
              const discount = calculateDiscount(bundle.originalPrice, bundle.salePrice);
              const timeRemaining = formatTimeRemaining(bundle.validUntil);
              
              return (
                <Card 
                  key={bundle.id} 
                  className="border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl overflow-hidden group"
                >
                  {/* Discount Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-lg px-3 py-1 shadow-lg">
                      -{discount}%
                    </Badge>
                  </div>

                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                    {bundle.imageUrl ? (
                      <img 
                        src={bundle.imageUrl} 
                        alt={bundle.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-20 w-20 text-purple-300" />
                      </div>
                    )}
                    
                    {/* Time Remaining */}
                    {timeRemaining && (
                      <div className="absolute bottom-3 left-3">
                        <Badge className="bg-black/70 text-white backdrop-blur-sm">
                          <Clock className="h-3 w-3 mr-1" />
                          {timeRemaining}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{bundle.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{bundle.description}</p>

                    {/* Products Included */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Includes:</p>
                      <div className="flex flex-wrap gap-2">
                        {bundle.products.slice(0, 3).map((product) => (
                          <Badge 
                            key={product.id} 
                            variant="outline" 
                            className="bg-purple-50 border-purple-200 text-purple-700 text-xs"
                          >
                            {product.name}
                          </Badge>
                        ))}
                        {bundle.products.length > 3 && (
                          <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">
                            +{bundle.products.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-through">₹{bundle.originalPrice.toLocaleString()}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{bundle.salePrice.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                          Save ₹{(bundle.originalPrice - bundle.salePrice).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button 
                      className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/25"
                      onClick={() => navigate(`/contact`)}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get This Bundle
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-12 w-12 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Bundle Offers Available</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Check back soon for amazing bundle deals!</p>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="rounded-xl border-2 border-black"
            >
              Browse Products
            </Button>
          </div>
        )}

        {/* Why Bundles Section */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">Why Choose Bundles?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Percent className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Maximum Savings</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Save up to 50% compared to buying individually</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">All-in-One</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Get multiple premium services in a single purchase</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Exclusive Deals</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Bundle-only prices not available elsewhere</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
