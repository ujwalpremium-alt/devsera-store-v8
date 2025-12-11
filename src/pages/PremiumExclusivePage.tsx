import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock, Gift, Zap, BookOpen, Tag, Loader2, ArrowLeft, Copy, Check, ExternalLink, Eye, EyeOff, ChevronLeft, ChevronRight, ShoppingCart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/hooks/usePremium';
import { PremiumBadge } from '@/components/shared/PremiumBadge';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/components/ui/use-toast';

const ITEMS_PER_PAGE = 8;

// Pagination Component
const PaginationControls = ({ currentPage, total, onPageChange }: { currentPage: number; total: number; onPageChange: (page: number) => void }) => {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(total, 5) }, (_, i) => {
          let page = i + 1;
          if (total > 5) {
            if (currentPage <= 3) page = i + 1;
            else if (currentPage >= total - 2) page = total - 4 + i;
            else page = currentPage - 2 + i;
          }
          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={`h-8 w-8 p-0 text-xs ${currentPage === page ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
            >
              {page}
            </Button>
          );
        })}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === total}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Premium Product Card Component
const PremiumProductCard = ({ product, premiumPrice, originalPrice, badge, badgeColor, onClick }: { 
  product: any; 
  premiumPrice: number; 
  originalPrice: number;
  badge: string;
  badgeColor: string;
  onClick: () => void;
}) => (
  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white dark:bg-gray-800 cursor-pointer" onClick={onClick}>
    <div className="relative aspect-square overflow-hidden">
      <img
        src={product.image || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&q=80'}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <Badge className={`absolute top-2 left-2 sm:top-3 sm:left-3 ${badgeColor} text-white shadow-lg px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold z-10`}>
        {badge}
      </Badge>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
    <CardContent className="p-2 sm:p-4">
      <h3 className="font-semibold text-xs sm:text-sm md:text-base line-clamp-2 mb-1 sm:mb-2 text-gray-900 dark:text-white">
        {product.name}
      </h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          {premiumPrice === 0 ? (
            <span className="text-sm sm:text-lg md:text-xl font-bold text-green-600">FREE</span>
          ) : (
            <span className="text-sm sm:text-lg md:text-xl font-bold text-amber-600">₹{premiumPrice}</span>
          )}
          {originalPrice > premiumPrice && (
            <span className="text-[10px] sm:text-sm text-gray-400 line-through">₹{originalPrice}</span>
          )}
        </div>
        <Button 
          size="sm" 
          className="bg-amber-500 hover:bg-amber-600 h-6 sm:h-8 px-2 sm:px-3"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default function PremiumExclusivePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium, membership, loading, premiumProducts, premiumContent, fetchPremiumProducts, fetchPremiumContent } = usePremium();
  const { products } = useProducts();
  const [activeTab, setActiveTab] = useState('products');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTricks, setExpandedTricks] = useState<Set<string>>(new Set());
  
  // Pagination states
  const [freeProductsPage, setFreeProductsPage] = useState(1);
  const [exclusiveProductsPage, setExclusiveProductsPage] = useState(1);
  const [discountedProductsPage, setDiscountedProductsPage] = useState(1);
  const [tricksPage, setTricksPage] = useState(1);
  const [guidesPage, setGuidesPage] = useState(1);
  const [offersPage, setOffersPage] = useState(1);

  useEffect(() => {
    if (isPremium) {
      fetchPremiumProducts();
      fetchPremiumContent();
    }
  }, [isPremium, fetchPremiumProducts, fetchPremiumContent]);

  // Memoized filtered data
  const freeProducts = useMemo(() => premiumProducts.filter(pp => pp.is_free_for_premium), [premiumProducts]);
  const discountedProducts = useMemo(() => premiumProducts.filter(pp => pp.premium_discount_percent > 0), [premiumProducts]);
  const exclusiveProducts = useMemo(() => premiumProducts.filter(pp => pp.premium_only), [premiumProducts]);
  const tricks = useMemo(() => premiumContent.filter(c => c.content_type === 'trick'), [premiumContent]);
  const guides = useMemo(() => premiumContent.filter(c => c.content_type === 'guide'), [premiumContent]);
  const offers = useMemo(() => premiumContent.filter(c => c.content_type === 'offer'), [premiumContent]);

  // Pagination helpers
  const paginate = <T,>(items: T[], page: number) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  };
  const totalPages = (items: any[]) => Math.ceil(items.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Loading premium content...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-950">
        <Lock className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">Login Required</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-4 text-sm sm:text-base">Please login to access premium content</p>
        <Button onClick={() => navigate('/login')}>Login</Button>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-100 dark:bg-amber-900/50 mb-4 sm:mb-6">
            <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Premium Content</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
            This content is exclusively available for premium members. Join premium to unlock all exclusive products, tricks, and offers.
          </p>
          <Button 
            onClick={() => navigate('/premium')}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
          >
            <Crown className="h-4 w-4 mr-2" />
            Join Premium
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-950 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/20 mb-3 sm:mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-2">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                Premium Exclusive
              </h1>
              <p className="text-xs sm:text-sm md:text-base opacity-90 mt-1">Your exclusive premium content</p>
            </div>
            <PremiumBadge size="sm" expiresAt={membership?.expires_at} className="bg-white/20" />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6">
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <Gift className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-green-600 dark:text-green-400 mx-auto mb-1" />
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-700 dark:text-green-300">{freeProducts.length}</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-green-600 dark:text-green-400">Free Products</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <Crown className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-300">{exclusiveProducts.length}</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-amber-600 dark:text-amber-400">Exclusive</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <Tag className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300">{discountedProducts.length}</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-blue-600 dark:text-blue-400">Discounted</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-2 sm:p-3 md:p-4 text-center">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-300">{tricks.length + guides.length}</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-purple-600 dark:text-purple-400">Tricks & Guides</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-10 sm:h-12">
            <TabsTrigger value="products" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-full">
              <Gift className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Products</span>
            </TabsTrigger>
            <TabsTrigger value="tricks" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-full">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Tricks</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-full">
              <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Offers</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6 sm:space-y-8 mt-0">
            {/* Free Products */}
            {freeProducts.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                    </div>
                    Free for You
                  </h2>
                  <Badge className="bg-green-500 text-white text-[10px] sm:text-xs">{freeProducts.length} items</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {paginate(freeProducts, freeProductsPage).map((pp) => {
                    const product = products.find(p => p.id === pp.product_id);
                    if (!product) return null;
                    return (
                      <PremiumProductCard
                        key={pp.id}
                        product={product}
                        premiumPrice={0}
                        originalPrice={product.salePrice}
                        badge="FREE"
                        badgeColor="bg-green-500"
                        onClick={() => navigate(`/product/${product.id}`)}
                      />
                    );
                  })}
                </div>
                <PaginationControls
                  currentPage={freeProductsPage}
                  total={totalPages(freeProducts)}
                  onPageChange={setFreeProductsPage}
                />
              </div>
            )}

            {/* Exclusive Products */}
            {exclusiveProducts.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    Premium Only
                  </h2>
                  <Badge className="bg-amber-500 text-white text-[10px] sm:text-xs">{exclusiveProducts.length} items</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {paginate(exclusiveProducts, exclusiveProductsPage).map((pp) => {
                    const product = products.find(p => p.id === pp.product_id);
                    if (!product) return null;
                    return (
                      <PremiumProductCard
                        key={pp.id}
                        product={product}
                        premiumPrice={product.salePrice}
                        originalPrice={product.salePrice}
                        badge="EXCLUSIVE"
                        badgeColor="bg-gradient-to-r from-amber-500 to-yellow-500"
                        onClick={() => navigate(`/product/${product.id}`)}
                      />
                    );
                  })}
                </div>
                <PaginationControls
                  currentPage={exclusiveProductsPage}
                  total={totalPages(exclusiveProducts)}
                  onPageChange={setExclusiveProductsPage}
                />
              </div>
            )}

            {/* Discounted Products */}
            {discountedProducts.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Premium Discounts
                  </h2>
                  <Badge className="bg-blue-500 text-white text-[10px] sm:text-xs">{discountedProducts.length} items</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {paginate(discountedProducts, discountedProductsPage).map((pp) => {
                    const product = products.find(p => p.id === pp.product_id);
                    if (!product) return null;
                    const discountedPrice = Math.round(product.salePrice * (1 - pp.premium_discount_percent / 100));
                    return (
                      <PremiumProductCard
                        key={pp.id}
                        product={product}
                        premiumPrice={discountedPrice}
                        originalPrice={product.salePrice}
                        badge={`${pp.premium_discount_percent}% OFF`}
                        badgeColor="bg-blue-500"
                        onClick={() => navigate(`/product/${product.id}`)}
                      />
                    );
                  })}
                </div>
                <PaginationControls
                  currentPage={discountedProductsPage}
                  total={totalPages(discountedProducts)}
                  onPageChange={setDiscountedProductsPage}
                />
              </div>
            )}

            {freeProducts.length === 0 && exclusiveProducts.length === 0 && discountedProducts.length === 0 && (
              <Card className="text-center py-8 sm:py-12 bg-white/50 dark:bg-gray-800/50">
                <CardContent>
                  <Gift className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                  <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 font-medium">No premium products available yet</p>
                  <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">Check back soon for exclusive deals!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tricks" className="space-y-6 sm:space-y-8 mt-0">
            {/* Tricks Section */}
            {tricks.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    Exclusive Tricks
                  </h2>
                  <Badge className="bg-amber-500 text-white text-[10px] sm:text-xs">{tricks.length} tricks</Badge>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  {paginate(tricks, tricksPage).map((trick) => (
                    <Card key={trick.id} className="border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-800 hover:shadow-xl transition-all overflow-hidden">
                      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
                              <Zap className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-sm sm:text-base md:text-lg truncate text-gray-900 dark:text-white">{trick.title}</CardTitle>
                              <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-0.5 line-clamp-1 dark:text-gray-400">{trick.description}</CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700 flex-shrink-0 text-[10px] sm:text-xs">Premium</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-3 sm:pt-4">
                        <div className="relative">
                          <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-[11px] sm:text-xs md:text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 ${
                            expandedTricks.has(trick.id) ? '' : 'max-h-20 sm:max-h-24 md:max-h-32 overflow-hidden'
                          }`}>
                            {trick.content_body}
                          </div>
                          {trick.content_body && trick.content_body.length > 150 && (
                            <div className={`${expandedTricks.has(trick.id) ? '' : 'absolute bottom-0 left-0 right-0 h-10 sm:h-12 md:h-16 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent'}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`${expandedTricks.has(trick.id) ? 'mt-2' : 'absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2'} text-amber-600 hover:text-amber-700 text-[10px] sm:text-xs h-6 sm:h-7`}
                                onClick={() => {
                                  const newExpanded = new Set(expandedTricks);
                                  if (newExpanded.has(trick.id)) {
                                    newExpanded.delete(trick.id);
                                  } else {
                                    newExpanded.add(trick.id);
                                  }
                                  setExpandedTricks(newExpanded);
                                }}
                              >
                                {expandedTricks.has(trick.id) ? (
                                  <><EyeOff className="h-3 w-3 mr-1" /> Show Less</>
                                ) : (
                                  <><Eye className="h-3 w-3 mr-1" /> Read More</>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                        {trick.content_url && (
                          <a 
                            href={trick.content_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] sm:text-xs md:text-sm text-amber-600 hover:text-amber-700 mt-2 sm:mt-3"
                          >
                            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                            View Resource
                          </a>
                        )}
                        <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                            Added {new Date(trick.created_at || '').toLocaleDateString()}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] sm:text-xs h-6 sm:h-7 md:h-8"
                            onClick={() => {
                              navigator.clipboard.writeText(trick.content_body || '');
                              setCopiedId(trick.id);
                              setTimeout(() => setCopiedId(null), 2000);
                              toast({ title: 'Copied!', description: 'Trick content copied to clipboard' });
                            }}
                          >
                            {copiedId === trick.id ? (
                              <><Check className="h-3 w-3 mr-1" /> Copied</>
                            ) : (
                              <><Copy className="h-3 w-3 mr-1" /> Copy</>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <PaginationControls
                  currentPage={tricksPage}
                  total={totalPages(tricks)}
                  onPageChange={setTricksPage}
                />
              </div>
            )}

            {/* Guides Section */}
            {guides.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    Guides & Tutorials
                  </h2>
                  <Badge className="bg-purple-500 text-white text-[10px] sm:text-xs">{guides.length} guides</Badge>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  {paginate(guides, guidesPage).map((guide) => (
                    <Card key={guide.id} className="border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 hover:shadow-xl transition-all overflow-hidden">
                      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg flex-shrink-0">
                              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-sm sm:text-base md:text-lg truncate text-gray-900 dark:text-white">{guide.title}</CardTitle>
                              <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-0.5 line-clamp-1 dark:text-gray-400">{guide.description}</CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700 flex-shrink-0 text-[10px] sm:text-xs">Guide</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-3 sm:pt-4">
                        <div className="relative">
                          <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-[11px] sm:text-xs md:text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 ${
                            expandedTricks.has(guide.id) ? '' : 'max-h-20 sm:max-h-24 md:max-h-32 overflow-hidden'
                          }`}>
                            {guide.content_body}
                          </div>
                          {guide.content_body && guide.content_body.length > 150 && (
                            <div className={`${expandedTricks.has(guide.id) ? '' : 'absolute bottom-0 left-0 right-0 h-10 sm:h-12 md:h-16 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent'}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`${expandedTricks.has(guide.id) ? 'mt-2' : 'absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2'} text-purple-600 hover:text-purple-700 text-[10px] sm:text-xs h-6 sm:h-7`}
                                onClick={() => {
                                  const newExpanded = new Set(expandedTricks);
                                  if (newExpanded.has(guide.id)) {
                                    newExpanded.delete(guide.id);
                                  } else {
                                    newExpanded.add(guide.id);
                                  }
                                  setExpandedTricks(newExpanded);
                                }}
                              >
                                {expandedTricks.has(guide.id) ? (
                                  <><EyeOff className="h-3 w-3 mr-1" /> Show Less</>
                                ) : (
                                  <><Eye className="h-3 w-3 mr-1" /> Read More</>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                        {guide.content_url && (
                          <a 
                            href={guide.content_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] sm:text-xs md:text-sm text-purple-600 hover:text-purple-700 mt-2 sm:mt-3"
                          >
                            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                            View Resource
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <PaginationControls
                  currentPage={guidesPage}
                  total={totalPages(guides)}
                  onPageChange={setGuidesPage}
                />
              </div>
            )}

            {tricks.length === 0 && guides.length === 0 && (
              <Card className="text-center py-8 sm:py-12 bg-white/50 dark:bg-gray-800/50">
                <CardContent>
                  <Zap className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                  <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 font-medium">No tricks or guides available yet</p>
                  <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">Check back soon for exclusive content!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="offers" className="space-y-4 sm:space-y-6 mt-0">
            {offers.length > 0 ? (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                    </div>
                    Exclusive Offers & Coupons
                  </h2>
                  <Badge className="bg-green-500 text-white text-[10px] sm:text-xs">{offers.length} offers</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  {paginate(offers, offersPage).map((offer) => (
                    <Card key={offer.id} className="border-green-200 dark:border-green-800 bg-white dark:bg-gray-800 hover:shadow-xl transition-all overflow-hidden">
                      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg flex-shrink-0">
                              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-sm sm:text-base md:text-lg truncate text-gray-900 dark:text-white">{offer.title}</CardTitle>
                              <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-0.5 line-clamp-1 dark:text-gray-400">{offer.description}</CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700 flex-shrink-0 text-[10px] sm:text-xs">Offer</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-3 sm:pt-4">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-2 border-dashed border-green-300 dark:border-green-700">
                          <p className="text-[11px] sm:text-xs md:text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                            {offer.content_body}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                            Premium Exclusive
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] sm:text-xs border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 h-6 sm:h-7 md:h-8"
                            onClick={() => {
                              navigator.clipboard.writeText(offer.content_body || '');
                              setCopiedId(offer.id);
                              setTimeout(() => setCopiedId(null), 2000);
                              toast({ title: 'Copied!', description: 'Offer details copied to clipboard' });
                            }}
                          >
                            {copiedId === offer.id ? (
                              <><Check className="h-3 w-3 mr-1" /> Copied</>
                            ) : (
                              <><Copy className="h-3 w-3 mr-1" /> Copy</>
                            )}
                          </Button>
                        </div>
                        <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Single use per product - Don't share!
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <PaginationControls
                  currentPage={offersPage}
                  total={totalPages(offers)}
                  onPageChange={setOffersPage}
                />
              </div>
            ) : (
              <Card className="text-center py-8 sm:py-12 bg-white/50 dark:bg-gray-800/50">
                <CardContent>
                  <Tag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                  <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 font-medium">No special offers available yet</p>
                  <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">Check back soon for exclusive deals!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
