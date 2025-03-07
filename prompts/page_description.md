# Implementation Plan: Welcome Description Banner for Active Chat Page

## Task Description
Add a fixed banner at the top of the active chat page that displays the welcome description text with an information icon. The banner should have subtle styling with a light border, maintain the same background color as the page, and display text in light gray. The banner should only appear when welcome description text exists.

## Files Involved

1. **`app/chat/external/[id]/page.tsx`**
   - Source of the `welcomeDescription` data
   - Currently fetches and stores this in `chatInstanceData`

2. **`app/chat/external/[id]/active/page.tsx`**
   - The active chat page where the banner needs to be displayed
   - Currently uses query client for prefetching

3. **`components/external-chat.tsx`**
   - The main chat component that will need to display the banner
   - Will need to receive the welcome description as a prop

4. **New Component: `components/welcome-banner.tsx`**
   - A new component to be created for the banner UI

## Implementation Steps

### Step 1: Data Transfer Between Pages
Since the welcome description is available in the initial page but needed in the active chat page, we need to pass this data:

1. Modify `app/chat/external/[id]/page.tsx`:
   - In the `handleStartChat` function, when navigating to the active chat page, include the welcome description as a URL parameter:
   ```typescript
   router.push(`/chat/external/${id}/active?responseId=${responseId}&welcomeDesc=${encodeURIComponent(chatInstanceData?.welcomeDescription || '')}`);
   ```

### Step 2: Create Welcome Banner Component
Create a new file `components/welcome-banner.tsx`:
- Create a simple functional component that accepts the welcome description as a prop
- Use the Info icon from Lucide icons
- Apply subtle styling with light border and light gray text
- Include conditional rendering logic to only show when text exists

### Step 3: Retrieve and Pass Data in Active Chat Page
Modify `app/chat/external/[id]/active/page.tsx`:
- Extract the welcome description from URL parameters
- Pass this data to the ExternalChat component as a new prop

### Step 4: Update External Chat Component
Modify `components/external-chat.tsx`:
- Update the component props interface to accept the welcome description
- Import and place the WelcomeBanner component at the top of the chat UI
- Pass the welcome description to the banner component

### Step 5: Styling Considerations
- The banner should have:
  - Fixed position at the top of the page
  - Light border (1px) at the bottom
  - Same background color as the page
  - Light gray text
  - Appropriate padding and spacing
  - Proper alignment of the info icon and text

## Detailed Component Structure

### `components/welcome-banner.tsx`
```typescript
// Structure only - not implementation
import { Info } from "lucide-react";

interface WelcomeBannerProps {
  welcomeDescription?: string;
}

export function WelcomeBanner({ welcomeDescription }: WelcomeBannerProps) {
  if (!welcomeDescription) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-10 border-b border-gray-200 bg-[inherit] py-2 px-4">
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        <Info className="h-4 w-4 text-gray-400" />
        <p className="text-sm text-gray-400">{welcomeDescription}</p>
      </div>
    </div>
  );
}
```

### Data Flow Diagram
```
[app/chat/external/[id]/page.tsx]
  chatInstanceData.welcomeDescription
           |
           v
  URL parameter in navigation
           |
           v
[app/chat/external/[id]/active/page.tsx]
  Extract from searchParams
           |
           v
  Pass as prop to ExternalChat
           |
           v
[components/external-chat.tsx]
  Receive welcomeDescription prop
           |
           v
  Render WelcomeBanner component
           |
           v
[components/welcome-banner.tsx]
  Display banner if welcomeDescription exists
```

## Considerations and Edge Cases

1. **URL Parameter Length**: If the welcome description is very long, consider alternative methods like session storage
2. **Layout Adjustments**: The fixed banner will take up vertical space, so the chat container may need padding adjustments
3. **Responsive Design**: Ensure the banner looks good on all screen sizes
4. **Text Overflow**: Handle long welcome descriptions with proper text wrapping or truncation
5. **Z-index Management**: Ensure the fixed banner doesn't conflict with other UI elements

This plan provides a comprehensive approach to implementing the welcome description banner while maintaining the existing functionality and adhering to your styling preferences.
