# Franko Platform Style Guidelines

This document serves as a reference for the visual styling conventions used throughout the Franko Platform. Please follow these guidelines to ensure a consistent and cohesive user experience.

## Color Palette

| Purpose                | Color      | Hex      |
|------------------------|------------|----------|
| Primary Lime           | Lime       | #E4F222  |
| Accent Lime (Light)    | Light Lime | #F5FF78  |
| Icon Foreground        | Charcoal   | #1C1617  |
| Background (Cards)     | Off White  | #FAFAFA  |
| Button Text (on Lime)  | Charcoal   | #1C1617  |
| Disabled/Secondary     | Gray       | #F5F5F5  |

## Icon Styles

- **Circular Backgrounds:**
  - All major section icons should have circular backgrounds
  - Background color: `#F5FF78` (Light Lime)
  - Icon color: `#1C1617` (Charcoal)
  - Header icons: `w-6 h-6` circular background with `h-4 w-4` icons
  - Field icons: `w-5 h-5` circular background with `h-3 w-3` icons

## Button Styles

- **Primary Action Buttons:**
  - Background: `#E4F222` (Primary Lime)
  - Hover: `#F5FF78` (Light Lime)
  - Text: `#1C1617` (Charcoal)
  - Example: `bg-[#E4F222] hover:bg-[#F5FF78] text-black`

## Loading Spinners

- **Standard Loading Spinner:**
  - Color: `#E4F222` (Primary Lime)
  - Style: Full circle with transparent top border
  - Classes: `animate-spin rounded-full border-2 border-[#E4F222] border-t-transparent`
  - Sizes: `h-8 w-8` for main loading states, `h-4 w-4` for inline states

## Progress Bar
- **Progress fill:** `#E4F222` (Lime)
- **Background:** `#F5F5F5` or similar light gray

## General Principles

- **Consistency:** Use the same color palette across all components
- **Accessibility:** Ensure sufficient contrast ratios
- **Responsive:** Icons and buttons should scale appropriately on different screen sizes
- **Performance:** Use CSS classes over inline styles for better caching

---

_If you add new components or styles, please update this document to keep the design system up to date._
