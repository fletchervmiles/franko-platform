import { logger } from "@/lib/logger";
import { put } from "@vercel/blob";
import { isDarkColor } from "@/lib/color-utils";

export interface BrandfetchResult {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  /**
   * Simple theme hint based on primaryColor luminance. "dark" = use dark UI, "light" for light UI.
   * Undefined when no primaryColor could be extracted (callers should fall back to their own defaults).
   */
  theme?: "light" | "dark";
}

const BRANDFETCH_API_URL = process.env.BRANDFETCH_API_URL || "https://api.brandfetch.io/v2";
const BRANDFETCH_API_KEY = process.env.BRANDFETCH_API_KEY;

/**
 * Fetch brand details from Brandfetch API
 */
export async function fetchBrandDetails(domain: string): Promise<BrandfetchResult> {
  if (!BRANDFETCH_API_KEY) {
    logger.warn("BRANDFETCH_API_KEY not set, using defaults");
    return getDefaultBranding();
  }

  try {
    // Remove protocol from domain
    const cleanDomain = domain.replace(/^https?:\/\//, '');
    
    logger.info(`Fetching brand details for domain: ${cleanDomain}`);
    
    const response = await fetch(`${BRANDFETCH_API_URL}/brands/${cleanDomain}`, {
      headers: {
        'Authorization': `Bearer ${BRANDFETCH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.info(`No brand data found for domain: ${cleanDomain}`);
        return getDefaultBranding();
      }
      throw new Error(`Brandfetch API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract relevant brand information
    const logoUrl = await extractAndUploadLogo(data);

    // Determine primary/secondary colours
    const primaryColor = extractPrimaryColor(data);
    const secondaryColor = extractSecondaryColor(data);

    // Decide light vs dark theme based on luminance of primary colour (fallback to light)
    const theme: "light" | "dark" | undefined = primaryColor
      ? isDarkColor(primaryColor) ? "dark" : "light"
      : undefined;

    const result: BrandfetchResult = {
      logoUrl,
      primaryColor,
      secondaryColor,
      companyName: data.name || undefined,
      theme,
    };

    logger.info(`Successfully fetched brand details for ${cleanDomain}:`, {
      hasLogo: !!result.logoUrl,
      hasPrimaryColor: !!result.primaryColor,
      primaryColor: result.primaryColor,
      theme: result.theme,
      companyName: result.companyName,
      colorsFound: data.colors?.length || 0,
    });

    return result;

  } catch (error) {
    logger.error(`Error fetching brand details for domain ${domain}:`, error);
    return getDefaultBranding();
  }
}

async function extractAndUploadLogo(data: any): Promise<string | undefined> {
  // Check if blob storage is configured
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    logger.warn('BLOB_READ_WRITE_TOKEN not configured, returning direct URL instead of uploading to blob storage');
    return extractLogoUrl(data);
  }

  try {
    const logoUrl = extractLogoUrl(data);
    if (!logoUrl) {
      logger.info('No suitable logo found in brand data');
      return undefined;
    }

    logger.info(`Found logo URL: ${logoUrl}, uploading to blob storage...`);

    // Download the logo
    const logoResponse = await fetch(logoUrl);
    if (!logoResponse.ok) {
      throw new Error(`Failed to download logo: ${logoResponse.status}`);
    }

    const logoArrayBuffer = await logoResponse.arrayBuffer();
    const logoBuffer = Buffer.from(logoArrayBuffer);

    // Determine file extension from URL or content type
    const contentType = logoResponse.headers.get('content-type') || 'image/png';
    const extension = getFileExtension(logoUrl, contentType);
    
    // Create unique filename
    const timestamp = Date.now();
    const filename = `logos/brandfetch-${timestamp}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, logoBuffer, {
      access: 'public',
      contentType,
    });

    logger.info(`Logo uploaded to blob storage successfully: ${blob.url}`);
    return blob.url;

  } catch (error) {
    logger.error('Failed to download and upload logo, falling back to direct URL:', error);
    // Fallback to direct URL if blob upload fails
    return extractLogoUrl(data);
  }
}

function extractLogoUrl(data: any): string | undefined {
  if (!data.logos || !Array.isArray(data.logos)) {
    return undefined;
  }

  // Priority order for logo selection:
  // 1. Icon (square/circular) - best for chat avatars
  // 2. Logo with light theme (works on most backgrounds)
  // 3. Any logo as fallback

  // Look for icon first
  const iconEntry = data.logos.find((logo: any) => logo.type === 'icon');
  if (iconEntry && iconEntry.formats) {
    const iconFormat = findBestFormat(iconEntry.formats);
    if (iconFormat) {
      logger.info('Selected icon for logo');
      return iconFormat.src;
    }
  }

  // Look for light theme logo
  const lightLogo = data.logos.find((logo: any) => 
    logo.type === 'logo' && logo.theme === 'light'
  );
  if (lightLogo && lightLogo.formats) {
    const logoFormat = findBestFormat(lightLogo.formats);
    if (logoFormat) {
      logger.info('Selected light theme logo');
      return logoFormat.src;
    }
  }

  // Fallback to any logo
  for (const logo of data.logos) {
    if (logo.formats) {
      const logoFormat = findBestFormat(logo.formats);
      if (logoFormat) {
        logger.info(`Selected fallback logo (type: ${logo.type}, theme: ${logo.theme})`);
        return logoFormat.src;
      }
    }
  }

  return undefined;
}

function findBestFormat(formats: any[]): any {
  // Prefer PNG > SVG > WEBP > JPEG for quality and compatibility
  const formatPriority = ['png', 'svg', 'webp', 'jpeg', 'jpg'];
  
  for (const format of formatPriority) {
    const found = formats.find((f: any) => f.format === format);
    if (found) return found;
  }
  
  // Return first available format if none match our preferences
  return formats[0];
}

function getFileExtension(url: string, contentType: string): string {
  // Try to get extension from URL first
  const urlExtension = url.split('.').pop()?.toLowerCase();
  if (urlExtension && ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(urlExtension)) {
    return urlExtension;
  }

  // Fallback to content type
  const typeMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
  };

  return typeMap[contentType] || 'png';
}

function extractPrimaryColor(data: any): string | undefined {
  // If we have a structured colors array with types, use smart selection
  if (data.colors && Array.isArray(data.colors) && data.colors.length > 0) {
    const smartColor = selectContrastingColor(data.colors);
    if (smartColor) {
      return ensureHexFormat(smartColor);
    }
  }

  // Fallback to simple selection if no structured colors
  const fallbackColors = [
    data.colors?.[0]?.hex,
    data.colors?.primary?.hex,
    data.brandColors?.[0],
  ];

  const color = fallbackColors.find(c => c && typeof c === 'string');
  return color ? ensureHexFormat(color) : undefined;
}

/**
 * Select a color that contrasts well with the accent color (logo)
 * Logic: Find accent color, then select light/dark color that contrasts most
 */
function selectContrastingColor(colors: any[]): string | undefined {
  if (!colors || colors.length === 0) return undefined;

  // Find the accent color (logo color)
  const accentColor = colors.find((c: any) => c.type === 'accent');
  
  if (!accentColor || !accentColor.brightness) {
    // No accent color found, fallback to first available color
    return colors[0]?.hex;
  }

  // Find light and dark colors
  const lightColor = colors.find((c: any) => c.type === 'light');
  const darkColor = colors.find((c: any) => c.type === 'dark');

  // If we don't have both light and dark, use what we have
  if (!lightColor && !darkColor) {
    return colors[0]?.hex;
  }
  if (!lightColor) return darkColor?.hex;
  if (!darkColor) return lightColor?.hex;

  // Calculate contrast: larger brightness difference = better contrast
  const lightContrast = Math.abs(accentColor.brightness - (lightColor.brightness || 255));
  const darkContrast = Math.abs(accentColor.brightness - (darkColor.brightness || 0));

  // Select the color with better contrast
  const selectedColor = lightContrast > darkContrast ? lightColor : darkColor;
  
  logger.info(`Smart color selection:`, {
    accentBrightness: accentColor.brightness,
    lightContrast,
    darkContrast,
    selected: selectedColor.type,
    selectedHex: selectedColor.hex
  });

  return selectedColor.hex;
}

function extractSecondaryColor(data: any): string | undefined {
  if (!data.colors || !Array.isArray(data.colors)) return undefined;

  // For secondary color, look for a complementary color
  // If we used accent as primary, try dark or light as secondary
  const usedAccent = data.colors.find((c: any) => c.type === 'accent');
  
  if (usedAccent) {
    // If we used accent, try to find a contrasting color
    const secondaryOptions = ['dark', 'light', 'brand'];
    for (const type of secondaryOptions) {
      const color = data.colors.find((c: any) => c.type === type && c.hex !== usedAccent.hex);
      if (color && color.hex) {
        return ensureHexFormat(color.hex);
      }
    }
  }

  // Fallback to second color in array
  const colors = [
    data.colors?.[1]?.hex,
    data.colors?.secondary?.hex,
    data.brandColors?.[1],
  ];

  const color = colors.find(c => c && typeof c === 'string');
  return color ? ensureHexFormat(color) : undefined;
}

function ensureHexFormat(color: string): string {
  // Ensure color starts with # and is valid hex
  const cleanColor = color.replace(/^#/, '');
  if (/^[0-9A-Fa-f]{6}$/.test(cleanColor)) {
    return `#${cleanColor}`;
  }
  return color; // Return as-is if not valid hex
}

function getDefaultBranding(): BrandfetchResult {
  return {
    // Return empty object - let modal system use its own defaults
    // Only logoUrl might be extracted, colors should be undefined
  };
} 