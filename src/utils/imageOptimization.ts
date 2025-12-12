// Image optimization utilities

/**
 * Get optimized image URL with width and quality parameters
 * Works with Unsplash and other CDN-compatible image sources
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: {
    width?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}
): string {
  if (!url) return '';
  
  const { width = 400, quality = 80, format = 'webp' } = options;
  
  // Handle Unsplash images
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?w=${width}&q=${quality}&fm=${format}&fit=crop&auto=format`;
  }
  
  // Handle Supabase storage images
  if (url.includes('supabase.co/storage')) {
    // Supabase doesn't support image transformation in free tier
    // Return original URL
    return url;
  }
  
  // Return original URL for other sources
  return url;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  url: string | undefined | null,
  sizes: number[] = [320, 640, 960, 1280]
): string {
  if (!url) return '';
  
  return sizes
    .map(size => `${getOptimizedImageUrl(url, { width: size })} ${size}w`)
    .join(', ');
}

/**
 * Placeholder image for loading states
 */
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzliYTFhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+';

/**
 * Default fallback image
 */
export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=400&q=80';
