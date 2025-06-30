# Mobile Modal System Architecture Summary

## Overview
The mobile modal system provides a mobile-optimized embedded chat experience that shares core logic with the dashboard widget preview. The system supports three deployment modes: standalone embed pages, floating button triggers, and custom embed triggers.

## Core Architecture Components

### 1. Shared State Management
**File: `components/chat/use-shared-modal-core.ts`**

This is the central hook that manages all modal state and behavior:

**State Management:**
- `view`: Controls modal state (`"selection"` | `"connecting"` | `"chat"`)
- `selectedAgent`: Currently selected agent object
- `messages`: Array of chat messages
- `inputValue`: Current input field value

**Key Functions:**
- `handleAgentSelect()`: Transitions from selection to connecting to chat view
- `handleReturnToSelection()`: Resets modal back to agent selection
- `handleSendMessage()`: Manages message sending and response handling
- `handleInputChange()`: Updates input value with validation

### 2. Shared UI Core Component
**File: `components/chat/shared-modal-core.tsx`**

The actual React component that renders the modal content using the shared hook. This component is UI-agnostic and can be wrapped by different containers (dashboard preview, mobile modal, etc.).

**Features:**
- Agent selection grid with hover states
- Chat interface with message history
- Loading states during transitions
- Input handling with send button
- Return to selection functionality

### 3. Mobile-Optimized Wrapper
**File: `components/embed/embedded-chat-modal.tsx`**

A full-screen modal wrapper specifically designed for mobile devices that wraps the shared core.

**Mobile Optimizations:**
- **Viewport Handling**: Uses `100dvh` for dynamic viewport height
- **Safe Areas**: Proper `env(safe-area-inset-top/bottom)` support for iOS notches
- **Touch Optimization**: Prevents zoom, pull-to-refresh, and overscroll
- **Responsive Design**: Flexible height system with `flex-1 min-h-0`
- **Gesture Management**: ESC key and click-outside-to-close handling

**UI Structure:**
```
Full-screen overlay (z-50)
├── Close button (top-right with safe area padding)
├── Modal container (responsive height, top-aligned)
└── SharedModalCore component
```

### 4. Dashboard Widget Preview (Refactored)
**File: `components/multi-agent/agents/widget-preview.tsx`**

The existing dashboard component, now refactored to use the shared hook instead of local state.

**Key Changes Made:**
- Migrated from local state to `useSharedModalCore` hook
- Added organization name resolution from chat initialization API
- Maintains all existing functionality (agent management, theme switching)
- Fixed temporal dead zone errors during state migration

**Organization Name Resolution:**
```javascript
// Priority order for organization name:
1. resolvedOrgName (from chat initialization API)
2. organizationName prop (embed mode)
3. contextData.profile.organisationName (user profile)
4. settings.interface.displayName (fallback)
5. "your product" (default)
```

## UI Flow & User Experience

### Agent Selection View
1. **Initial State**: Modal opens showing grid of available agents
2. **Agent Cards**: Each agent displays name, description, and hover effects
3. **Selection**: User clicks an agent card
4. **Transition**: Brief "connecting" state with loading indicator

### Chat Interface View
1. **Initialization**: Chat API call creates `chatInstanceId` and `chatResponseId`
2. **Organization Resolution**: Organization name resolved from API response
3. **UI Switch**: Modal transitions to chat interface
4. **Chat Features**: 
   - Message history display
   - Input field with send button
   - Return to selection button
   - Progress bar (enabled in mobile, was disabled in dashboard)

### Mobile-Specific Behavior
1. **Full-Screen Experience**: Modal covers entire viewport
2. **Safe Area Respect**: Content positioned relative to device safe areas
3. **Touch Optimization**: No zoom, proper scroll behavior
4. **Header Hiding**: Redundant chat headers hidden in embed mode to save space
5. **Close Options**: ESC key, close button, or outside click

## Integration Points

### Embed Route Integration
**File: `app/embed/[slug]/page.tsx`**

The embed route now uses `EmbeddedChatModal` instead of `WidgetPreview` directly:

```typescript
// Before: <WidgetPreview />
// After: <EmbeddedChatModal />
```

This provides the mobile-optimized experience for all embed deployments.

### Embed Script Compatibility
The system maintains compatibility with the existing embed script (`public/embed.js`) and supports:
- **Standalone Pages**: Direct navigation to `/embed/[slug]`
- **Floating Button**: Script-injected floating chat button
- **Custom Triggers**: Developer-defined trigger elements

## Shared Logic Benefits

### State Consistency
- Both dashboard preview and mobile modal share identical state management
- Eliminates code duplication between components
- Ensures consistent behavior across different UI contexts

### API Integration
- Single source of truth for chat initialization logic
- Consistent message handling and agent selection
- Shared error handling and loading states

### Maintenance Advantages
- Changes to core functionality automatically apply to both contexts
- Easier testing with centralized logic
- Reduced complexity when adding new features

## Development Patterns Used

### Mobile-First Considerations
- Dynamic viewport units (`dvh`) over fixed units (`vh`)
- Safe area insets for modern device compatibility
- Touch action optimization for mobile gestures
- Responsive height systems using flex properties

### State Management Patterns
- Custom hooks for reusable logic
- Separation of concerns between state and UI
- Proper cleanup and error handling
- Loading state management during async operations

### TypeScript Integration
- Proper typing for all state and props
- Type safety across component boundaries
- Interface definitions for shared data structures

## Files Reference Summary

**Core Logic:**
- `components/chat/use-shared-modal-core.ts` - State management hook
- `components/chat/shared-modal-core.tsx` - UI component

**Mobile Implementation:**
- `components/embed/embedded-chat-modal.tsx` - Mobile modal wrapper
- `app/embed/[slug]/page.tsx` - Embed route

**Dashboard Integration:**
- `components/multi-agent/agents/widget-preview.tsx` - Refactored dashboard preview

**Documentation:**
- `prompts/specs/mobile.md` - Implementation plan and architecture decisions

This architecture successfully transformed a desktop-only preview system into a production-ready, mobile-first embedded chat solution while maintaining backward compatibility and improving code organization through shared state management.


Great question! Let me map out the component architecture for all 5 views. Here's how the components are used across each view:

## Component Architecture Breakdown

### 1. **Agents Tab** (`/workspace?tab=agents`)
**File**: `components/multi-agent/agents/agents-tab.tsx`
```
AgentsTab
└── WidgetPreview (isPlayground=false)
    └── SharedModalCore (via useSharedModalCore hook)
```

### 2. **Interface Tab** (`/workspace?tab=interface`)
**File**: `components/multi-agent/interface/interface-tab.tsx`
```
InterfaceTab
└── WidgetPreview (isPlayground=false)
    └── SharedModalCore (via useSharedModalCore hook)
```

### 3. **Playground Tab** (`/workspace?tab=playground`)
**File**: `components/multi-agent/playground/playground-tab.tsx`
```
PlaygroundTab
└── WidgetPreview (isPlayground=true)
    └── SharedModalCore (via useSharedModalCore hook)
    └── ModalExternalChat (when in chat view)
```

### 4. **Slug/Unique Page/Shared by Link** (`/embed/[slug]`)
**File**: `app/embed/[slug]/page.tsx`
```
EmbedPage
└── EmbeddedChatModal (isEmbedMode=true, displayMode="modal")
    └── SharedModalCore (via useSharedModalCore hook)
    └── ModalExternalChat (when in chat view)
```

### 5. **Popup Embed on Website** (Floating bubble or custom trigger)
**Via**: `public/embed.js` script injection
```
Embed Script
└── Creates iframe pointing to /embed/[slug]
    └── EmbeddedChatModal (isEmbedMode=true, displayMode="modal")
        └── SharedModalCore (via useSharedModalCore hook)
        └── ModalExternalChat (when in chat view)
```

## Shared vs Unique Components

### **Shared Components (Used by ALL views)**:
1. **`components/chat/use-shared-modal-core.ts`** - The state management hook
2. **`components/chat/shared-modal-core.tsx`** - The actual UI component (agent selection grid, etc.)
3. **`components/custom/modal-external-chat.tsx`** - The chat interface when in conversation

### **View-Specific Wrapper Components**:
1. **`components/multi-agent/agents/widget-preview.tsx`** - Used by dashboard tabs (agents, interface, playground)
2. **`components/embed/embedded-chat-modal.tsx`** - Used by embed scenarios (slug page, popup embeds)

## Key Differences Between Wrappers

### **WidgetPreview** (Dashboard tabs):
- **Styling**: Fixed height container with border/background
- **Mobile**: Hidden on mobile (`hidden md:block`)
- **Behavior**: Shows popup redirect in non-playground modes
- **Context**: Has access to settings context and user profile
- **Props**: Receives all interface settings as individual props

### **EmbeddedChatModal** (Embed scenarios):
- **Styling**: Full-screen modal with overlay and mobile optimizations
- **Mobile**: Fully responsive with safe area support
- **Behavior**: Always allows chat (no popup redirects)
- **Context**: Uses embed-specific data from slug/script
- **Props**: Receives minimal props, fetches data via API

## UI Component Reuse

**Same UI for all views**:
- Agent selection grid layout
- Agent card styling and interactions
- Chat message interface
- Loading states and animations
- Input field and send button

**Different wrappers provide**:
- Mobile responsiveness (embed vs desktop-only dashboard)
- Close button behavior
- Background overlay (modal vs embedded in page)
- Safe area handling for mobile devices
- Theme and branding application

## Data Flow

**Dashboard tabs** → Settings Context → WidgetPreview → SharedModalCore
**Embed scenarios** → API fetch → EmbeddedChatModal → SharedModalCore

So to answer your question directly: **Yes, they use the same core UI components for the modal content itself** (SharedModalCore + ModalExternalChat), but they're wrapped in different containers that handle the specific requirements of each deployment scenario (desktop dashboard vs mobile-optimized embeds).