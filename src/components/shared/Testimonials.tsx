import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  role: string;
  content: string;
  rating: number;
  product: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Rahul Sharma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    role: 'Graphic Designer',
    content: 'Got my Canva Pro subscription within 30 minutes! The quality is amazing and support is super responsive. Highly recommended!',
    rating: 5,
    product: 'Canva Pro'
  },
  {
    id: 2,
    name: 'Priya Patel',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    role: 'Marketing Manager',
    content: 'LinkedIn Premium at such a low price is unbelievable. Been using it for 3 months now without any issues. Great service!',
    rating: 5,
    product: 'LinkedIn Premium'
  },
  {
    id: 3,
    name: 'Amit Kumar',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    role: 'Student',
    content: 'Netflix Premium for the whole family at this price is a steal! Fast delivery and excellent customer support via Telegram.',
    rating: 5,
    product: 'Netflix Premium'
  },
  {
    id: 4,
    name: 'Sneha Reddy',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    role: 'Content Creator',
    content: 'ChatGPT Plus has been a game changer for my work. The instant delivery and affordable price made it an easy choice.',
    rating: 5,
    product: 'ChatGPT Plus'
  },
  {
    id: 5,
    name: 'Vikram Singh',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
    role: 'Freelancer',
    content: 'Been a customer for 6 months now. Every subscription I bought works perfectly. The bundle deals are amazing!',
    rating: 5,
    product: 'Multiple Products'
  }
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const nextTestimonial = () => {
    setCurrentIndex(prev => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevTestimonial = () => {
    setCurrentIndex(prev => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
            What Our Customers Say
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
            Join thousands of happy customers who trust Devsera Store
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            {/* Quote Icon */}
            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 text-teal-100 dark:text-teal-900">
              <Quote className="h-12 w-12 sm:h-16 sm:w-16 md:h-24 md:w-24" />
            </div>

            <div className="relative z-10">
              {/* Stars */}
              <div className="flex gap-0.5 sm:gap-1 mb-4 sm:mb-6">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 dark:text-gray-200 mb-5 sm:mb-6 md:mb-8 leading-relaxed">
                "{testimonials[currentIndex].content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 sm:gap-4">
                <img
                  src={testimonials[currentIndex].avatar}
                  alt={testimonials[currentIndex].name}
                  className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-teal-500"
                />
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                    {testimonials[currentIndex].name}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {testimonials[currentIndex].role} • {testimonials[currentIndex].product}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
            <button
              onClick={prevTestimonial}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-300 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Dots */}
            <div className="flex gap-1.5 sm:gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsAutoPlaying(false);
                    setTimeout(() => setIsAutoPlaying(true), 10000);
                  }}
                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-teal-500 w-6 sm:w-8' 
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-300 transition-colors"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
