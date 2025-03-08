# Internal Chat System: Requirements and Implementation Plan with Component Reuse

## Purpose and Motivation

The internal chat system will enable authenticated users to analyze and extract insights from their collected research data. This system leverages many existing components from the external chat functionality, allowing for efficient implementation while providing a specialized analysis tool for customers.

## Core Requirements

### 1. User Experience
- Authenticated users should be able to access an AI chat interface within the platform
- Users should be able to select specific chat instances and responses to analyze
- The interface should be similar to the external chat but with analysis-focused features

### 2. Data Integration
- The system should incorporate conversation plans, transcripts, and summaries
- Users should be able to select which responses to include in the analysis

### 3. Conversation Persistence
- Chat sessions should be saved and retrievable
- Users should be able to continue previous analysis conversations

### 4. Security and Access Control
- Only authenticated users should access the system
- Users should only see their own chat instances and responses

## Components to Reuse and Adapt

### 1. External Chat Components (Major Reuse)

#### `external-chat.tsx`
- **How to Reuse**: This component can be largely copied to create `internal-chat.tsx`
- **Modifications Needed**:
  - Remove progress bar functionality
  - Replace auto-greeting with response selection
  - Modify API endpoint references
  - Update UI elements to reflect analysis focus
  - Remove objective tracking logic

#### `external-chat-wrapper.tsx`
- **How to Reuse**: Can be copied almost directly to create `internal-chat-wrapper.tsx`
- **Modifications Needed**:
  - Update component names and references
  - Change loading messages to reflect analysis context
  - Update prop types to include chat instance data

#### `message.tsx`
- **How to Reuse**: Can be used directly without modification
- **Benefits**:
  - Already handles markdown rendering
  - Supports various message types
  - Includes optimizations for rendering performance

### 2. API Route Components

#### `app/(external-chat)/api/external-chat/route.ts`
- **How to Reuse**: Can serve as a template for `internal-chat/route.ts`
- **Modifications Needed**:
  - Remove objective update functionality
  - Remove progress bar updates
  - Simplify the message processing pipeline
  - Modify system prompt generation to include response data
  - Update authentication checks

### 3. UI Components

#### `nav-sidebar.tsx`
- **How to Reuse**: Can be used directly as the navigation container
- **Integration Point**: Wrap the internal chat interface with this component

#### `internal-input.tsx`
- **How to Reuse**: Already exists but needs enhancement
- **Modifications Needed**:
  - Add response selection functionality
  - Connect to chat instance data
  - Update the UI to show selected responses

### 4. Database Schema and Queries

#### `chat-responses-schema.ts` and `chat-instances-schema.ts`
- **How to Reuse**: Reference these schemas for foreign key relationships
- **New Schema Needed**: Create `internal-chat-sessions-schema.ts` with similar structure

## New Components/Files to Create

1. **Database Schema**
   - `db/schema/internal-chat-sessions-schema.ts`
   - Will be similar to chat-responses-schema but simpler

2. **Database Queries**
   - `db/queries/internal-chat-sessions-queries.ts`
   - Can adapt patterns from chat-responses-queries.ts

3. **API Route**
   - `app/(internal-chat)/api/internal-chat/route.ts`
   - Based on external-chat route but simplified

4. **Page Component**
   - `app/(internal-chat)/internal-chat/[id]/page.tsx`
   - Similar structure to external chat page

5. **Chat Components**
   - `components/internal-chat-wrapper.tsx` (adapted from external-chat-wrapper)
   - `components/internal-chat.tsx` (adapted from external-chat)

## Implementation Plan with Component Reuse

### Phase 1: Database Setup

1. **Create Internal Chat Sessions Schema**
   - Reference `chat-responses-schema.ts` for structure
   - Simplify to only include necessary fields:
     - id, userId, chatInstanceId, messagesJson, timestamps

2. **Create Database Query Functions**
   - Use `chat-responses-queries.ts` as a template
   - Implement CRUD operations for internal chat sessions
   - Add a function to get responses by chat instance ID

### Phase 2: API Development

1. **Create Internal Chat API Route**
   - Copy `external-chat/route.ts` as a starting point
   - Remove objective update and progress tracking code
   - Modify system prompt generation to include response data
   - Update the message processing pipeline
   - Retain the streaming response functionality

2. **Context Generation Logic**
   - Adapt the system prompt generation from external chat
   - Add logic to format chat instance and response data
   - Implement filtering based on selected responses

### Phase 3: Frontend Development

1. **Create Page Component**
   - Reference the external chat page structure
   - Implement authentication and authorization checks
   - Fetch initial data (chat instance, existing session)
   - Render the chat wrapper component

2. **Implement Chat Wrapper Component**
   - Copy `external-chat-wrapper.tsx` and modify
   - Update component names and references
   - Keep the error boundary and Suspense implementation

3. **Develop Main Chat Component**
   - Copy `external-chat.tsx` as a starting point
   - Remove progress bar and objective tracking
   - Update to use internal-input component
   - Retain the message rendering and auto-scroll logic

4. **Enhance Internal Input Component**
   - Build upon the existing component
   - Add response selection functionality
   - Connect to chat instance data
   - Update the UI to show selected responses

## Detailed Component Adaptation

### 1. From `external-chat.tsx` to `internal-chat.tsx`

**Elements to Keep:**
- useChat hook integration
- Message rendering logic
- Auto-scrolling functionality
- Loading states
- Error handling

**Elements to Remove:**
- Progress bar
- Auto-greeting
- Objective tracking
- End conversation handling

**Elements to Add:**
- Response selection state
- Chat instance context
- Analysis-focused UI elements

### 2. From `external-chat-wrapper.tsx` to `internal-chat-wrapper.tsx`

**Elements to Keep:**
- Dynamic import pattern
- Error boundary
- Loading states
- Suspense implementation

**Elements to Modify:**
- Component names
- Loading messages
- Prop types

### 3. From `external-chat/route.ts` to `internal-chat/route.ts`

**Elements to Keep:**
- Authentication checks
- Message processing
- AI model integration
- Streaming response
- Conversation saving

**Elements to Remove:**
- Objective updates
- Progress tracking
- End conversation tool
- Web search tool (unless needed)

**Elements to Add:**
- Response data formatting
- Chat instance context integration
- Response selection handling

## Implementation Advantages of Component Reuse

1. **Consistency**
   - Reusing components ensures a consistent user experience
   - Similar code structure makes maintenance easier
   - Shared styling and behavior patterns

2. **Efficiency**
   - Significantly reduces development time
   - Leverages already tested and optimized components
   - Minimizes duplicate code

3. **Reliability**
   - Components like message.tsx are already battle-tested
   - Error handling patterns are established
   - Performance optimizations are in place

## Implementation Challenges

1. **Adapting External Chat Logic**
   - Need to carefully remove external-specific functionality
   - Must preserve core chat functionality
   - Requires understanding of component interdependencies

2. **Response Selection Integration**
   - Need to enhance internal-input.tsx
   - Must implement efficient response filtering
   - Should handle potentially large numbers of responses

3. **System Prompt Optimization**
   - Need to format response data efficiently
   - Must handle potentially large context windows
   - Should implement effective caching

## Implementation Steps

### Step 1: Database Schema and Queries
1. Create internal-chat-sessions-schema.ts based on chat-responses-schema.ts
2. Implement query functions in internal-chat-sessions-queries.ts
3. Add function to get responses by chat instance ID

### Step 2: API Route
1. Copy external-chat/route.ts to internal-chat/route.ts
2. Remove objective update and progress tracking code
3. Implement system prompt generation with response data
4. Update authentication and error handling

### Step 3: Page Component
1. Create internal-chat/[id]/page.tsx
2. Implement authentication and data fetching
3. Render internal-chat-wrapper component

### Step 4: Chat Components
1. Copy external-chat-wrapper.tsx to internal-chat-wrapper.tsx and update
2. Copy external-chat.tsx to internal-chat.tsx and modify
3. Enhance internal-input.tsx with response selection

### Step 5: Testing and Refinement
1. Test the complete flow from page load to conversation
2. Verify response selection and context generation
3. Optimize performance for large response datasets

By leveraging existing components, we can efficiently implement this internal chat system while ensuring it meets the specific needs of data analysis. The reuse of tested components will significantly reduce development time and ensure a consistent user experience across the platform.
