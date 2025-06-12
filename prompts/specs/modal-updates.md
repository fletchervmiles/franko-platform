# Modal Updates Requirements - FINAL SPEC

## Overview

Transform the single-agent conversation system into a multi-agent modal widget that can be embedded on customer websites. Users will create modal widgets with 3-5 pre-selected agent types, and visitors will choose which conversation to start from a card grid interface.

## Architecture Decisions (FINAL)

### **Data Model**
- **New `modals` table**: Stores widget configuration, branding, and embed slug
- **Enhanced `chat_instances`**: Pre-create one row per enabled agent with static conversation plans
- **Unchanged `chat_responses`**: Add `agent_type` field for analytics
- **Static agent library**: ~20 hard-coded conversation plans stored in `/agent_prompts/`

### **User Flow**
1. User creates modal → selects agent types → configures branding
2. System pre-creates chat_instances with static conversation plans
3. Embed script shows card grid → visitor clicks → existing `/chat/external/[id]` flow
4. All existing quota/webhook/analytics logic unchanged

### **UI Pattern**
- **Center modal popover** with dimmed background (survey pattern, not support chat)
- **Embed options**: Auto-bubble icon OR manual button trigger
- **Responsive**: Same chat window component with different wrappers

---

## Database Schema Changes

### 1. New `modals` Table
```sql
CREATE TABLE modals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           text NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name              text NOT NULL,                    -- internal label
  embed_slug        text UNIQUE NOT NULL,             -- /embed/{slug}
  brand_settings    jsonb,                            -- colors, theme, display name, etc.
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

### 2. Enhanced `chat_instances` Table
```sql
ALTER TABLE chat_instances
  ADD COLUMN modal_id       uuid REFERENCES modals(id),
  ADD COLUMN agent_type     varchar(50),                    -- e.g. 'feedback_positive'
  ADD COLUMN is_enabled     boolean DEFAULT true,          -- toggle on/off in modal
  ADD COLUMN is_modal_agent boolean DEFAULT false;         -- distinguish from legacy links

CREATE INDEX chat_instances_modal_idx ON chat_instances(modal_id);
```

### 3. Enhanced `chat_responses` Table
```sql
ALTER TABLE chat_responses
  ADD COLUMN agent_type varchar(50);                       -- for analytics
```

---

## Implementation Roadmap

### Phase 1: Core Backend (Week 1-2)
1. **Database Migration**
   - Add new `modals` table
   - Add columns to `chat_instances` and `chat_responses`
   - Create agent library in `/agent_prompts/`

2. **API Routes**
   - `POST /api/modals` - Create modal + pre-create chat_instances
   - `PATCH /api/modals/:id` - Update settings, toggle agents
   - `GET /embed/:slug` - Serve widget config + agent list

### Phase 2: Dashboard UI (Week 2-3)
1. **New Modal Management Page**: `app/modals/[id]/page.tsx`
   - **Agents Tab**: Toggle grid of 20 agent types
   - **Interface Tab**: Branding config (colors, theme, display name)
   - **Connect Tab**: Embed code generator with bubble/manual options

2. **Workspace Integration**
   - Update "Create Agent" → "Create Modal" button
   - Modal list view in workspace

### Phase 3: Embed Widget (Week 3-4)
1. **Embed Script**: `public/embed.js`
   - Lightweight loader (~2KB)
   - Support `data-mode="bubble"` and `data-mode="manual"`
   - Center modal popover with card grid

2. **ChatWindow Wrapper Modes**
   - `mode="page"` - Full browser tab (existing)
   - `mode="popover"` - Center modal with dimmed background
   - Responsive design for mobile

### Phase 4: Polish & Launch (Week 4-5)
1. **Playground** (Optional)
   - Inline preview in Connect tab OR
   - Standalone `/sandbox/:slug` page

2. **Analytics Enhancement**
   - Per-agent completion rates
   - Modal-level aggregate stats

---

## Frontend Component Structure

```
app/modals/[id]/page.tsx                 // Main modal management page
├── components/modal-agent-picker.tsx    // Agent selection grid
├── components/modal-interface-config.tsx // Branding configuration
├── components/modal-embed-code.tsx      // Code generator
└── components/modal-playground.tsx      // Preview (optional)

components/chat-window.tsx               // Shared chat component
├── mode="page"     // Full browser tab
├── mode="popover"  // Center modal overlay
└── mode="inline"   // Future iframe embed

public/embed.js                          // Lightweight embed script
```

---

## Quota & Usage (UNCHANGED)

- **Conversation Plan Quota**: Ignored (static plans don't count)
- **Response Quota**: Unchanged (increments on >50% completion)
- **Analytics**: Enhanced with `agent_type` field for per-agent insights

---

## Embed Options

### Auto-Bubble (Recommended)
```html
<script
  src="https://yourapp.com/embed.js"
  async
  data-modal="xyz123"
  data-mode="bubble"
  data-color="#4f46e5"
  data-icon="💬">
</script>
```

### Custom Button Trigger
```html
<script
  src="https://yourapp.com/embed.js"
  async
  data-modal="xyz123"
  data-mode="manual">
</script>

<button onclick="franko.open('xyz123')">Send Feedback</button>
```

---

## Next Steps

1. **Database Migration** - Create tables and add columns
2. **Component Development** - Build Agents and Interface tabs
3. **API Development** - Modal CRUD operations
4. **Embed Script** - Lightweight widget loader
5. **Testing & Polish** - Cross-browser, mobile, performance

**Target MVP**: 4-5 weeks for full modal widget functionality
