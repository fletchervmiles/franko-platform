# Modal Chat Initialization Speed Optimization

## Overview
This document outlines the implementation plan for making the modal chat feel instant by showing cached first responses while handling the AI SDK requirements in the background.

## Problem Statement
- Current flow takes 3-5 seconds to show first agent message
- Users see "Hi, I'm ready" and must type again
- First message has noticeably higher latency than subsequent messages

## Solution Summary
Show a pre-written agent greeting instantly while sending a hidden "Hi, I'm ready" message to satisfy the AI SDK's requirement for a user message first.

## Implementation Plan

### Phase 1: Add Cached First Responses to Agent Data

#### Step 1.1: Update Agent Type Definition
**File**: `lib/agents-data.ts`

Add a new field to the Agent type:
```typescript
export type Agent = {
  // ... existing fields ...
  cachedFirstResponse: string; // New field
}
```

#### Step 1.2: Add Cached Responses to Each Agent
**File**: `lib/agents-data.ts`

Update each agent in the `agentsData` array:
```typescript
{
  id: "AGENT01",
  name: "Discovery Trigger",
  // ... existing fields ...
  cachedFirstResponse: "Thanks for joining! We'll keep this short and sharp! To start, how did you first hear about {organisation_name}?"
},
{
  id: "AGENT02", 
  name: "Persona + Problem",
  // ... existing fields ...
  cachedFirstResponse: "Thanks for joining! We'll keep this short and sharp! To start, could you tell me yourself and what you hoped {organisation_name} would help you achieve?"
},
{
  id: "AGENT03",
  name: "Activation Hurdles",
  // ... existing fields ...
  cachedFirstResponse: "Thanks for joining! We'll keep this short and sharp! Thinking about the actually paying for {organisation_name}, did anything give you pause—or maybe push you to say 'yes' right away?"
},
{
  id: "AGENT04",
  name: "Key Benefit",
  // ... existing fields ...
  cachedFirstResponse: "Thanks for joining! We'll keep this short and sharp! To start, what's the single thing you love most about {organisation_name}?"
},
{
  id: "AGENT05",
  name: "Improvements & Friction",
  // ... existing fields ...
  cachedFirstResponse: "Thanks for joining! We'll keep this short and sharp! To start, what's the one thing we could do to improve {organisation_name} for you?"
},
{
  id: "AGENT06",
  name: "Feature Wishlist",
  // ... existing fields ...
  cachedFirstResponse: "Thanks for joining! We'll keep this short and sharp! So, which feature would you love us to build next for {organisation_name}?"
}
```

### CRITICAL: JSON Response Handling

**Important**: The API returns full JSON responses like:
```json
{
  "response": "Thanks for joining! We'll keep this short and sharp! To start, how did you first hear about {organisation_name}?",
  "currentObjectives": { /* objectives data */ }
}
```

But we only show the `response` field in the UI. When reconstructing conversation history for the API, we need to preserve the full JSON structure.

### Phase 2: Update Modal External Chat Component

#### Step 2.1: Create New Modal External Chat Component
**File**: `components/modal-external-chat.tsx`

Currently this component likely uses `useChat`. We need to replace it with manual fetch calls.

1. Remove the `useChat` import
2. Create separate states for UI messages and API messages:

```typescript
// Add isTyping to Message type
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  isTyping?: boolean; // Optional typing indicator flag
};

export function ModalExternalChat({ 
  chatInstanceId, 
  chatResponseId,
  agentType,
  organizationName,
  onConversationComplete,
  ...props 
}) {
  // Separate UI from API state
  const [uiMessages, setUiMessages] = useState<Message[]>([]);
  const [isFirstMessageSent, setIsFirstMessageSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Get agent data
  const agent = useMemo(() => 
    agentsData.find(a => a.id === agentType),
    [agentType]
  );
```

#### Step 2.2: Show Typing Indicator Then Cached Response
```typescript
useEffect(() => {
  if (!agent || isFirstMessageSent) return;
  
  // Step 1: Show typing indicator immediately
  const typingMessage: Message = {
    id: 'typing-indicator',
    role: 'assistant',
    content: '', // Empty content
    isTyping: true, // Special flag for typing state
    createdAt: new Date(),
  };
  
  setUiMessages([typingMessage]);
  
  // Step 2: After 1 second, replace with cached response
  const typingTimer = setTimeout(() => {
    const cachedFirstMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: agent.cachedFirstResponse
        .replace(/{organisation_name}/g, organizationName || 'our product')
        .replace(/{product}/g, organizationName || 'our product'),
      createdAt: new Date(),
      isTyping: false,
    };
    
    setUiMessages([cachedFirstMessage]);
  }, 1000); // 1 second delay
  
  // Step 3: Send hidden first message in background (starts immediately)
  sendHiddenFirstMessage();
  
  // Cleanup
  return () => clearTimeout(typingTimer);
}, [agent, organizationName, isFirstMessageSent]);
```

#### Step 2.3: Implement Hidden First Message
```typescript
const sendHiddenFirstMessage = async () => {
  if (isFirstMessageSent) return;
  
  setIsFirstMessageSent(true);
  
  try {
    // This is what the AI SDK needs - a user message
    const response = await fetch('/api/external-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ 
          role: 'user', 
          content: 'Hi, I'm ready',
          id: generateUUID()
        }],
        chatInstanceId,
        chatResponseId,
        organizationName,
      }),
    });
    
    if (!response.ok) throw new Error('Failed to send first message');
    
    const data = await response.json();
    
    // Log any mismatch for monitoring (but don't show to user)
    if (data.content !== uiMessages[0]?.content) {
      console.log('First response mismatch:', {
        cached: uiMessages[0]?.content,
        actual: data.content
      });
    }
  } catch (error) {
    console.error('Failed to send hidden first message:', error);
    // Could show retry button here if needed
  }
};
```

#### Step 2.4: Handle User Messages with Queueing
```typescript
// Add a ref to track if the hidden first message has completed
const hiddenMessageCompleteRef = useRef(false);
const queuedMessageRef = useRef<string | null>(null);

const sendMessage = async (userInput: string) => {
  if (!userInput.trim() || isSending) return;
  
  // If hidden message hasn't completed yet, queue this message
  if (!hiddenMessageCompleteRef.current) {
    console.log('Hidden message still in progress, queueing user message');
    queuedMessageRef.current = userInput;
    // Still show the user message in UI immediately
    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: userInput,
      createdAt: new Date(),
    };
    setUiMessages(prev => [...prev, userMessage]);
    return;
  }
  
  setIsSending(true);
  
  // Add user message to UI immediately (if not already added)
  const lastMessage = uiMessages[uiMessages.length - 1];
  if (lastMessage?.content !== userInput || lastMessage?.role !== 'user') {
    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: userInput,
      createdAt: new Date(),
    };
    setUiMessages(prev => [...prev, userMessage]);
  }
  
  try {
    // Reconstruct full conversation for API
    // IMPORTANT: Use the full JSON response, not just the text shown in UI
    const apiMessages = [
      { role: 'user', content: 'Hi, I'm ready' }, // Hidden
      { 
        role: 'assistant', 
        // Use the full API response if available, otherwise construct it
        content: firstApiResponseRef.current?.fullResponse || JSON.stringify({
          response: uiMessages[0].content,
          currentObjectives: {} // Default empty objectives
        })
      },
      ...uiMessages.slice(1).map(msg => ({ // All visible messages
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userInput } // Current message
    ];
    
    const response = await fetch('/api/external-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: apiMessages,
        chatInstanceId,
        chatResponseId,
        organizationName,
      }),
    });
    
    if (!response.ok) throw new Error('Failed to send message');
    
    const data = await response.json();
    
    // Add assistant response to UI
    const assistantMessage: Message = {
      id: data.id || generateUUID(),
      role: 'assistant',
      content: data.content,
      createdAt: new Date(),
    };
    
    setUiMessages(prev => [...prev, assistantMessage]);
    
    // Check for conversation completion
    if (data.objectives?.isComplete) {
      onConversationComplete?.();
    }
    
  } catch (error) {
    console.error('Failed to send message:', error);
    // Show error in UI
    setUiMessages(prev => [...prev, {
      id: generateUUID(),
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
      createdAt: new Date(),
    }]);
  } finally {
    setIsSending(false);
  }
};

// Add ref to store the full JSON response from API
const firstApiResponseRef = useRef<any>(null);

// Update sendHiddenFirstMessage to handle queued messages
const sendHiddenFirstMessage = async () => {
  if (isFirstMessageSent) return;
  
  setIsFirstMessageSent(true);
  
  try {
    const response = await fetch('/api/external-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ 
          role: 'user', 
          content: 'Hi, I'm ready',
          id: generateUUID()
        }],
        chatInstanceId,
        chatResponseId,
        organizationName,
      }),
    });
    
    if (!response.ok) throw new Error('Failed to send first message');
    
    const data = await response.json();
    
    // IMPORTANT: Store the full JSON response for API history
    firstApiResponseRef.current = data;
    
    // Mark hidden message as complete
    hiddenMessageCompleteRef.current = true;
    
    // Process any queued message
    if (queuedMessageRef.current) {
      const queued = queuedMessageRef.current;
      queuedMessageRef.current = null;
      console.log('Processing queued message:', queued);
      // Process the queued message
      await sendMessage(queued);
    }
    
  } catch (error) {
    console.error('Failed to send hidden first message:', error);
    hiddenMessageCompleteRef.current = true; // Allow messages even on error
  }
};
```

#### Step 2.5: Update the Render Method with Typing Indicator
```typescript
return (
  <div className="flex flex-col h-full">
    <div className="flex-1 overflow-y-auto p-4">
      {uiMessages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "mb-4",
            message.role === 'user' ? 'text-right' : 'text-left'
          )}
        >
          <div
            className={cn(
              "inline-block p-3 rounded-lg max-w-[80%]",
              message.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : ''
            )}
          >
            {/* Use the same typing indicator pattern as message.tsx */}
            {message.isTyping && !message.content ? (
              <div className="flex items-center h-7">
                <div className="flex space-x-2 items-end bg-gray-100 px-4 py-2.5 rounded-xl">
                  <div className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-[typing_1.2s_ease-in-out_infinite]"></div>
                  <div className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-[typing_1.2s_ease-in-out_infinite_0.2s]"></div>
                  <div className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-[typing_1.2s_ease-in-out_infinite_0.4s]"></div>
                </div>
              </div>
            ) : (
              <div className={cn(
                !message.role || message.role === 'assistant' 
                  ? 'bg-transparent text-gray-900' 
                  : ''
              )}>
                {message.content}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
    
    <ChatInput 
      onSend={sendMessage} 
      disabled={isSending}
    />
  </div>
);
```

#### Step 2.6: Add CSS for Typing Animation
**File**: `app/globals.css`

Add the typing animation keyframe (if not already present):
```css
@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}
```

### Phase 3: Update Widget Preview Component

#### Step 3.1: Remove Loading State
**File**: `components/multi-agent/agents/widget-preview.tsx`

Update the `handleAgentSelect` function to skip the loading state:

```typescript
const handleAgentSelect = async (agent: Agent) => {
  if (onAgentSelect) {
    onAgentSelect(agent);
    return;
  }

  if (isPlayground) {
    setSelectedAgent(agent);
    
    try {
      // Initialize chat in background
      const response = await fetch('/api/modal-chat/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modalId: targetModalId,
          agentType: agent.id,
          // ... other fields
        }),
      });

      if (!response.ok) throw new Error('Failed to initialize chat');

      const data = await response.json();
      setChatInstanceId(data.chatInstanceId);
      setChatResponseId(data.chatResponseId);
      
      // Go straight to chatting - no loading state!
      setModalState('chatting');
      
    } catch (error) {
      console.error('Error initializing chat:', error);
      setModalState('agent-selection');
      setSelectedAgent(null);
    }
  }
};
```

## Complete File Summary

Here's a clear list of ALL files that need to be modified:

### 1. **`lib/agents-data.ts`**
   - Add `cachedFirstResponse: string` to the Agent type
   - Add cached responses to each agent in the `agentsData` array

### 2. **`components/modal-external-chat.tsx`** (MODIFY existing component)
   - Replace `useChat` with manual fetch calls
   - Add typing indicator that shows for 1 second
   - Show cached response after typing
   - Handle queued messages if user types early

### 3. **`components/multi-agent/agents/widget-preview.tsx`**
   - Remove the loading state in `handleAgentSelect`
   - Go straight from agent selection to chatting

### 4. **`app/globals.css`**
   - Add the `@keyframes typing` animation definition

### Files NOT to modify:
- `app/(external-chat)/api/external-chat/route.ts` - Leave as is
- Any other files not listed above

## Testing Checklist

1. **Basic Flow**
   - [ ] Agent selection shows chat immediately (no loading screen)
   - [ ] Typing indicator appears for 1 second
   - [ ] First assistant message replaces typing indicator smoothly
   - [ ] User can type and send messages normally
   - [ ] Conversation progresses as expected

2. **Edge Cases**
   - [ ] Network failure on hidden first message
   - [ ] User types very quickly before background init completes
   - [ ] User types while typing indicator is showing
   - [ ] Organization name substitution works correctly
   - [ ] Multiple agent selections in quick succession

3. **Performance**
   - [ ] Measure time from click to first message (should be <100ms)
   - [ ] Verify no UI freezes or jank
   - [ ] Check browser console for errors

## Rollback Plan

If issues arise, revert by:
1. Removing `cachedFirstResponse` from agent data
2. Restoring original `ModalExternalChat` with `useChat`
3. Re-enabling loading state in `WidgetPreview`

## Success Metrics

- Chat UI appears instantly on agent selection
- Typing indicator shows for exactly 1 second
- First message appears in ~1s (vs 3-5s currently) 
- Feels natural and responsive to users
- No increase in error rates
- User engagement increases (track via analytics)

## Implementation Notes

### Why 1 Second Delay?

The 1-second typing delay serves multiple purposes:
1. **Natural Feel**: Instant responses can feel jarring or fake
2. **Expectation Setting**: Users expect AI to "think" briefly
3. **Background Processing**: Gives time for the hidden API call to start
4. **Smooth Experience**: Prevents UI flashing if API is unusually fast

### Alternative Timing Options

You can adjust the typing duration based on message length:
```typescript
// Dynamic typing duration based on response length
const typingDuration = Math.min(
  500 + (agent.cachedFirstResponse.length * 10), // 10ms per character
  2000 // Max 2 seconds
);
```

## Pre-Implementation Checklist

Before starting implementation, ensure you understand:

1. **JSON Response Structure**
   - UI shows only the text from `response` field
   - API needs full JSON with objectives for conversation history
   - Store full API response for proper history reconstruction

2. **User Experience Flow**
   - Agent click → Instant chat UI with typing dots
   - 1 second later → Show cached response
   - Background → Send hidden "Hi, I'm ready" to API
   - If user types early → Queue their message

3. **Files to Modify** (only these 4):
   - `lib/agents-data.ts` - Add cached responses
   - `components/modal-external-chat.tsx` - Main implementation
   - `components/multi-agent/agents/widget-preview.tsx` - Remove loading
   - `app/globals.css` - Add typing animation

4. **Key Technical Details**
   - Replace `useChat` with manual fetch
   - Use refs to track state across renders
   - Handle message queueing for early user input
   - Match existing typing animation exactly

## Next Steps

After this optimization:
1. Consider caching more responses
2. Add database storage for populated prompts
3. Implement predictive pre-loading based on user behavior
