import tinycolor from "tinycolor2"

/**
 * Generate a subtle vertical gradient from a base color
 * @param baseHex - Base color in hex format (e.g., "#3E455D")
 * @param adjustment - Lightness adjustment percentage (default: 6)
 * @returns CSS gradient string
 */
export function generateGradient(baseHex: string, adjustment: number = 6): string {
  const base = tinycolor(baseHex)
  
  // For very light or dark colors, reduce the adjustment to prevent clamping
  const lightness = base.toHsl().l
  const adjustedDelta = lightness > 0.9 || lightness < 0.1 ? Math.min(adjustment, 3) : adjustment
  
  const topStop = base.clone().lighten(adjustedDelta).toHexString()
  const bottomStop = base.clone().darken(adjustedDelta).toHexString()
  
  return `linear-gradient(180deg, ${topStop} 0%, ${baseHex} 50%, ${bottomStop} 100%)`
}

/**
 * Determine optimal text color for accessibility using Y-I-Q brightness formula
 * @param hex - Background color in hex format
 * @returns "#000000" for light backgrounds, "#ffffff" for dark backgrounds
 */
export function pickTextColor(hex: string): string {
  // Expand shorthand #abc -> #aabbcc
  let expandedHex = hex
  if (hex.length === 4) {
    expandedHex = '#' + [...hex.slice(1)].map(c => c + c).join('')
  }
  
  const r = parseInt(expandedHex.substr(1, 2), 16)
  const g = parseInt(expandedHex.substr(3, 2), 16)
  const b = parseInt(expandedHex.substr(5, 2), 16)
  
  // Y-I-Q brightness formula (0-255)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  
  // Return black for light backgrounds, white for dark backgrounds
  return yiq >= 128 ? "#000000" : "#ffffff"
}

/**
 * Get the effective color for gradient or solid color scenarios
 * @param color - The color (could be used for gradient generation)
 * @param useGradient - Whether to generate a gradient or use solid color
 * @returns Object with background style and text color
 */
export function getColorStyles(color: string, useGradient: boolean = true) {
  const textColor = pickTextColor(color)
  
  if (useGradient) {
    return {
      backgroundImage: generateGradient(color),
      backgroundColor: color, // Fallback
      color: textColor
    }
  }
  
  return {
    backgroundColor: color,
    color: textColor
  }
} 