import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles, Shield, Clock, Gift, Zap, Star, Heart, Crown } from 'lucide-react';
import { useBannerPosts, BannerPost } from '@/hooks/useBannerPosts';

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  gradient: string;
  icon: React.ReactNode;
}

// Default slides as fallback
const defaultSlides: BannerSlide[] = [
  {
    id: '1',
    title: 'Premium Services',
    subtitle: 'Unbeatable Prices',
    description: 'Get instant access to Canva Pro, LinkedIn Premium, Netflix, and more at up to 85% off!',
    buttonText: 'Shop Now',
    buttonLink: '/',
    gradient: 'from-teal-600 via-teal-700 to-emerald-800',
    icon: <Sparkles className="h-8 w-8" />
  },
  {
    id: '2',
    title: 'Bundle & Save',
    subtitle: 'Up to 50% Extra Off',
    description: 'Combine multiple subscriptions and unlock exclusive bundle discounts!',
    buttonText: 'View Bundles',
    buttonLink: '/bundles',
    gradient: 'from-purple-600 via-pink-600 to-purple-800',
    icon: <Gift className="h-8 w-8" />
  },
  {
    id: '3',
    title: 'Fast Delivery',
    subtitle: 'Within 2 Hours',
    description: 'Get your credentials delivered instantly after payment verification.',
    buttonText: 'Learn More',
    buttonLink: '/contact',
    gradient: 'from-amber-500 via-orange-500 to-red-600',
    icon: <Clock className="h-8 w-8" />
  },
  {
    id: '4',
    title: '100% Secure',
    subtitle: 'Verified Accounts',
    description: 'All accounts are verified and come with replacement guarantee.',
    buttonText: 'Contact Support',
    buttonLink: '/support',
    gradient: 'from-blue-600 via-indigo-600 to-purple-700',
    icon: <Shield className="h-8 w-8" />
  }
];

const getIconFromType = (iconType: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    sparkles: <Sparkles className="h-8 w-8" />,
    gift: <Gift className="h-8 w-8" />,
    clock: <Clock className="h-8 w-8" />,
    shield: <Shield className="h-8 w-8" />,
    zap: <Zap className="h-8 w-8" />,
    star: <Star className="h-8 w-8" />,
    heart: <Heart className="h-8 w-8" />,
    crown: <Crown className="h-8 w-8" />,
  };
  return icons[iconType] || <Sparkles className="h-8 w-8" />;
};

export function HeroBanner() {
  const navigate = useNavigate();
  const { banners, isLoading } = useBannerPosts();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Convert database banners to slides format
  const bannerSlides = useMemo(() => {
    if (banners.length === 0) return defaultSlides;
    
    return banners.map((banner: BannerPost): BannerSlide => ({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      buttonText: banner.button_text,
      buttonLink: banner.button_link,
      gradient: banner.gradient,
      icon: getIconFromType(banner.icon_type),
    }));
  }, [banners]);

  useEffect(() => {
    if (!isAutoPlaying || bannerSlides.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % bannerSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, bannerSlides.length]);

  // Reset current slide if it's out of bounds
  useEffect(() => {
    if (currentSlide >= bannerSlides.length) {
      setCurrentSlide(0);
    }
  }, [bannerSlides.length, currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % bannerSlides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + bannerSlides.length) % bannerSlides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  if (isLoading) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 animate-pulse">
        <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20 lg:py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-6" />
            <div className="h-12 bg-white/20 rounded-lg w-3/4 mx-auto mb-4" />
            <div className="h-6 bg-white/20 rounded-lg w-1/2 mx-auto mb-8" />
            <div className="h-12 bg-white/20 rounded-xl w-32 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  const slide = bannerSlides[currentSlide] || bannerSlides[0];

  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${slide.gradient} transition-all duration-700`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-40 h-40 md:w-60 md:h-60 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 md:w-60 md:h-60 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 py-10 sm:py-14 md:py-18 lg:py-20 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon with Glow Effect */}
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl text-white mb-4 sm:mb-6 shadow-lg shadow-black/10 relative">
            <div className="absolute inset-0 bg-white/20 rounded-2xl animate-ping opacity-50" />
            <div className="relative z-10">
              {slide.icon}
            </div>
          </div>

          {/* Content with Better Typography */}
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-2 sm:mb-3 px-2 drop-shadow-lg">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 animate-gradient">
                {slide.subtitle}
              </span>
            </h2>
          )}
          
          {slide.description && (
            <p className="text-sm sm:text-base md:text-lg text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-4 leading-relaxed">
              {slide.description}
            </p>
          )}

          <Button
            onClick={() => navigate(slide.buttonLink)}
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-100 font-bold text-sm sm:text-base md:text-lg px-6 sm:px-8 py-4 sm:py-5 md:py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 group"
          >
            {slide.buttonText}
            <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Navigation Arrows - Improved */}
        {bannerSlides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all hover:scale-110 shadow-lg"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all hover:scale-110 shadow-lg"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        {/* Dots with Progress Indicator */}
        {bannerSlides.length > 1 && (
          <div className="flex justify-center items-center gap-2 sm:gap-3 mt-6 sm:mt-8">
            {bannerSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`relative h-2.5 sm:h-3 rounded-full transition-all duration-300 overflow-hidden ${
                  index === currentSlide 
                    ? 'w-8 sm:w-12 bg-white/30' 
                    : 'w-2.5 sm:w-3 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              >
                {index === currentSlide && isAutoPlaying && (
                  <div 
                    className="absolute inset-0 bg-white rounded-full origin-left"
                    style={{
                      animation: 'progress 5s linear infinite',
                    }}
                  />
                )}
                {index === currentSlide && !isAutoPlaying && (
                  <div className="absolute inset-0 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Slide Counter */}
        {bannerSlides.length > 1 && (
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs sm:text-sm font-medium">
            {currentSlide + 1} / {bannerSlides.length}
          </div>
        )}
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" className="dark:fill-gray-900"/>
        </svg>
      </div>

      {/* CSS for progress animation */}
      <style>{`
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </section>
  );
}
