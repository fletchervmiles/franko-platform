/**
 * Image compression utility
 * Compresses images client-side before upload to reduce file sizes
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  outputFormat: 'image/jpeg'
};

/**
 * Compress an image file
 */
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const { width: newWidth, height: newHeight } = calculateDimensions(
        img.width, 
        img.height, 
        opts.maxWidth, 
        opts.maxHeight
      );

      // Set canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Create new file with compressed data
          const compressedFile = new File(
            [blob], 
            `compressed_${file.name}`,
            { 
              type: opts.outputFormat,
              lastModified: Date.now()
            }
          );

          resolve(compressedFile);
        },
        opts.outputFormat,
        opts.quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the original file
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (originalWidth > originalHeight) {
    // Landscape orientation
    const width = Math.min(maxWidth, originalWidth);
    const height = width / aspectRatio;
    
    if (height > maxHeight) {
      return {
        width: maxHeight * aspectRatio,
        height: maxHeight
      };
    }
    
    return { width, height };
  } else {
    // Portrait orientation
    const height = Math.min(maxHeight, originalHeight);
    const width = height * aspectRatio;
    
    if (width > maxWidth) {
      return {
        width: maxWidth,
        height: maxWidth / aspectRatio
      };
    }
    
    return { width, height };
  }
}

/**
 * Check if compression is beneficial
 */
export function shouldCompress(file: File, maxSize: number = 500 * 1024): boolean {
  return file.size > maxSize;
}

/**
 * Get compression recommendations based on file size
 */
export function getCompressionOptions(file: File): CompressionOptions {
  const size = file.size;
  
  if (size > 5 * 1024 * 1024) { // > 5MB
    return {
      maxWidth: 600,
      maxHeight: 600,
      quality: 0.7,
      outputFormat: 'image/jpeg'
    };
  } else if (size > 2 * 1024 * 1024) { // > 2MB
    return {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
      outputFormat: 'image/jpeg'
    };
  } else if (size > 1 * 1024 * 1024) { // > 1MB
    return {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.85,
      outputFormat: 'image/jpeg'
    };
  } else {
    // Small files, minimal compression
    return {
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.9,
      outputFormat: file.type.includes('png') ? 'image/png' : 'image/jpeg'
    };
  }
} 