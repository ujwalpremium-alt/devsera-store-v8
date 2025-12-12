import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProducts } from '@/hooks/useProducts';
import { useBundles } from '@/hooks/useBundles';
import { mockProducts } from '@/data/mockData';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, X, Sparkles, Shield, Clock, HeadphonesIcon, Gift, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { HeroBanner } from '@/components/shared/HeroBanner';
import { FlashSales } from '@/components/shared/FlashSales';
import { CategoryIcons } from '@/components/shared/CategoryIcons';
import { TrustBadges } from '@/components/shared/TrustBadges';
import { Testimonials } from '@/components/shared/Testimonials';
import { HowItWorks } from '@/components/shared/HowItWorks';
import { ProductGridSkeleton } from '@/components/shared/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

export function HomePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const { products: dbProducts, isLoading } = useProducts();
  const { bundles } = useBundles();
  
  const products = isSupabaseConfigured && dbProducts.length > 0 ? dbProducts : mockProducts;

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const maxPrice = useMemo(() => {
    return Math.max(...products.map(p => p.salePrice || 0), 5000);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = (p.salePrice || 0) >= priceRange[0] && (p.salePrice || 0) <= priceRange[1];
      return matchesCategory && matchesSearch && matchesPrice;
    });
  }, [products, selectedCategory, searchQuery, priceRange]);

  const recentlyAddedProducts = useMemo(() => {
    return [...products].slice(0, 8);
  }, [products]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentPage, productsPerPage]);

  const clearFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setPriceRange([0, maxPrice]);
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedCategory !== 'All' || searchQuery !== '' || priceRange[0] > 0 || priceRange[1] < maxPrice;

  if (isLoading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  const FilterContent = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h4 className="font-semibold text-xs sm:text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">Price Range</h4>
        <div className="px-1 sm:px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            max={maxPrice}
            min={0}
            step={50}
            className="mb-3 sm:mb-4"
          />
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg">₹{priceRange[0]}</span>
            <span className="text-gray-400 dark:text-gray-500">to</span>
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg">₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full border-2 border-gray-300 dark:border-gray-600 hover:border-red-400 hover:text-red-500 text-sm"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20 lg:pb-0">
      <HeroBanner />
      <TrustBadges />
      <FlashSales products={products} />

      {bundles.length > 0 && (
        <section className="container mx-auto px-3 sm:px-4 pb-6 sm:pb-8">
          <div 
            onClick={() => navigate('/bundles')}
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 cursor-pointer hover:shadow-xl transition-all group"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Gift className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    🎉 Special Bundle Offers!
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm md:text-base">
                    Save up to 50% when you buy multiple subscriptions
                  </p>
                </div>
              </div>
              <Button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold rounded-xl group-hover:scale-105 transition-transform text-sm sm:text-base w-full sm:w-auto">
                View Bundles
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent mb-3 sm:mb-4">
            Featured Products
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Browse our collection of premium subscriptions at unbeatable prices
          </p>
        </div>

        <div className="mb-6 sm:mb-8">
          <CategoryIcons 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-10 h-12 sm:h-14 text-sm sm:text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="sm:hidden h-10 border-2 border-gray-200 dark:border-gray-700 rounded-xl relative"
                >
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[60vh] sm:h-[70vh] rounded-t-2xl sm:rounded-t-3xl">
                <SheetHeader className="mb-4 sm:mb-6">
                  <SheetTitle className="text-lg sm:text-xl">Filter Products</SheetTitle>
                </SheetHeader>
                <FilterContent />
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden sm:block mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
              <FilterContent />
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex items-center justify-between">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-white">{paginatedProducts.length}</span> of <span className="font-semibold text-gray-900 dark:text-white">{filteredProducts.length}</span> products
              {hasActiveFilters && (
                <button onClick={clearFilters} className="ml-2 text-primary hover:underline text-xs sm:text-sm">
                  (Clear)
                </button>
              )}
            </p>
          </div>
        </div>

        {/* Recently Added Section */}
        {!hasActiveFilters && recentlyAddedProducts.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Recently Added
              </h2>
            </div>
            <ProductGrid products={recentlyAddedProducts} />
          </section>
        )}

        {/* All Products Section */}
        <section>
          {!hasActiveFilters && (
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                All Products
              </h2>
            </div>
          )}

          {paginatedProducts.length > 0 ? (
            <>
              <ProductGrid products={paginatedProducts} />
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 sm:gap-2 mt-8 sm:mt-12">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="icon"
                            onClick={() => setCurrentPage(page)}
                            className="h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                          >
                            {page}
                          </Button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-1 sm:px-2 text-gray-400 dark:text-gray-500 text-sm">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              type="search"
              title="No products found"
              description="Try adjusting your search or filter criteria"
              actionLabel="Clear All Filters"
              onAction={clearFilters}
            />
          )}
        </section>
      </section>

      <HowItWorks />
      <Testimonials />

      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4">
              Why Choose Devsera Store?
            </h2>
            <p className="text-sm sm:text-base text-gray-400 dark:text-gray-500 max-w-2xl mx-auto px-4">
              We provide the best premium subscription sharing service with unmatched quality and support.
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 sm:mb-2">Fast Delivery</h3>
              <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">Get your credentials within 2 hours</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 sm:mb-2">100% Secure</h3>
              <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">All accounts verified & monitored</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <HeadphonesIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 sm:mb-2">24/7 Support</h3>
              <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">Always available via Telegram</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 sm:mb-2">Best Prices</h3>
              <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">Save up to 85% on subscriptions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <h4 className="font-bold text-lg mb-3 sm:mb-4">Devsera Store</h4>
              <p className="text-gray-400 text-sm leading-relaxed">Your trusted destination for premium digital products and subscriptions.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => navigate('/')} className="hover:text-white transition-colors">Home</button></li>
                <li><button onClick={() => navigate('/bundles')} className="hover:text-white transition-colors">Bundles</button></li>
                <li><button onClick={() => navigate('/premium')} className="hover:text-white transition-colors">Premium</button></li>
                <li><button onClick={() => navigate('/rewards')} className="hover:text-white transition-colors">Rewards</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => navigate('/support')} className="hover:text-white transition-colors">Help Center</button></li>
                <li><button onClick={() => navigate('/faq')} className="hover:text-white transition-colors">FAQ</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-white transition-colors">Contact Us</button></li>
                <li><button onClick={() => navigate('/about')} className="hover:text-white transition-colors">About Us</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => navigate('/refund-policy')} className="hover:text-white transition-colors">Refund Policy</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-gray-400">
            <p>© {new Date().getFullYear()} Devsera Store. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
