// lib/utils/api-messages.ts
// Utility to construct the full message history that is sent to the
// /api/external-chat endpoint.  Ensures every assistant turn contains
// the raw JSON that came from the backend so the model always sees
// consistent examples.

export interface UiMsgLike {
  role: string;
  content: string;
  fullResponse?: string;
}

/**
 * Build the array of messages that should be POST-ed to the external-chat API.
 * - `visibleUiMessages` are the messages currently rendered in the client.
 * - `hiddenGreeting` is the implicit first user message ("Hi, I'm ready").
 */
export function buildApiMessages(
  visibleUiMessages: UiMsgLike[],
  hiddenGreeting: string
) {
  const history: { role: string; content: string }[] = [];

  // 1. Hidden greeting
  history.push({ role: 'user', content: hiddenGreeting });

  if (visibleUiMessages.length > 0) {
    // 2. First assistant turn – use full JSON when available.
    const first = visibleUiMessages[0];
    history.push({
      role: 'assistant',
      content: first.fullResponse ?? first.content,
    });
  }

  // 3. Remaining visible messages
  for (const m of visibleUiMessages.slice(1)) {
    if (m.role === 'assistant' && m.fullResponse) {
      history.push({ role: 'assistant', content: m.fullResponse });
    } else {
      history.push({ role: m.role, content: m.content });
    }
  }

  return history;
} 