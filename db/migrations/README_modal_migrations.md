# Modal Widget Database Migrations

This document explains the database migrations for the multi-agent modal widget feature.

## Migration Files

### 0046_add_modals_table.sql
Creates the new `modals` table to store widget configuration and branding settings.

**Table Structure:**
- `id` - UUID primary key
- `user_id` - Foreign key to profiles table
- `name` - Internal label for the modal
- `embed_slug` - Unique slug for public embed access (`/embed/{slug}`)
- `brand_settings` - JSONB storing interface customization
- `is_active` - Boolean to enable/disable the modal
- `created_at` / `updated_at` - Timestamps

**Indexes:**
- Unique index on `embed_slug` for fast public lookups
- Index on `user_id` for dashboard queries

### 0047_add_modal_columns.sql
Adds modal-related columns to existing `chat_instances` and `chat_responses` tables.

**New Columns in `chat_instances`:**
- `modal_id` - Foreign key to modals table (nullable for legacy instances)
- `agent_type` - VARCHAR(50) mapping to agent IDs in `agents-data.ts`
- `is_enabled` - Boolean to toggle agents within a modal
- `is_modal_agent` - Boolean to distinguish from legacy single links

**New Columns in `chat_responses`:**
- `agent_type` - VARCHAR(50) for analytics (mirrors originating agent)

**Data Back-fill:**
- Sets `is_modal_agent = false` for all existing chat instances
- Sets `is_enabled = true` for all existing chat instances

## Brand Settings JSON Schema

The `brand_settings` column stores the complete interface configuration:

```json
{
  "displayName": "We'd love your feedback",
  "instructions": "Each chat is 1-3 minutes.",
  "theme": "light",
  "primaryBrandColor": "#3B82F6",
  "advancedColors": false,
  "chatIconText": "Feedback",
  "chatIconColor": "#3B82F6",
  "userMessageColor": "#3B82F6",
  "chatHeaderColor": "#3B82F6",
  "alignChatBubble": "right",
  "profilePictureUrl": null
}
```

## Query Functions

### Modal Operations
- `createModal()` - Create a new modal widget
- `getModalById()` - Get modal by ID with user ownership check
- `getModalBySlug()` - Get modal by embed slug (public access)
- `getModalsByUserId()` - List all modals for a user
- `updateModal()` - Update modal settings
- `deleteModal()` - Delete modal (cascades to chat instances)

### Modal Chat Instance Operations
- `createModalChatInstances()` - Pre-create chat instances for enabled agents
- `getModalChatInstances()` - Get all chat instances for a modal
- `getEnabledModalChatInstances()` - Get enabled instances for embed
- `toggleModalAgent()` - Enable/disable an agent within a modal
- `addAgentToModal()` - Add new agent to existing modal
- `removeAgentFromModal()` - Soft delete agent from modal

## Migration Safety

These migrations are **additive only** and will not affect existing data:

1. **No data loss** - Only adding new columns and tables
2. **Backward compatibility** - All existing chat instances continue to work
3. **Default values** - New columns have safe defaults
4. **Proper constraints** - Foreign keys with CASCADE delete for cleanup

## Running the Migrations

```bash
# Apply migrations (if using drizzle-kit)
npx drizzle-kit push:pg

# Or run SQL files directly
psql -d your_database -f db/migrations/0046_add_modals_table.sql
psql -d your_database -f db/migrations/0047_add_modal_columns.sql
```

## Rollback Plan

If needed, migrations can be rolled back by:

1. Dropping the new columns from `chat_instances` and `chat_responses`
2. Dropping the `modals` table
3. Removing the indexes

```sql
-- Rollback 0047
ALTER TABLE chat_instances DROP COLUMN IF EXISTS modal_id;
ALTER TABLE chat_instances DROP COLUMN IF EXISTS agent_type;
ALTER TABLE chat_instances DROP COLUMN IF EXISTS is_enabled;
ALTER TABLE chat_instances DROP COLUMN IF EXISTS is_modal_agent;
ALTER TABLE chat_responses DROP COLUMN IF EXISTS agent_type;

-- Rollback 0046
DROP TABLE IF EXISTS modals CASCADE;
```

## Next Steps

After running these migrations:

1. **API Development** - Create `/api/modals` endpoints
2. **Frontend Integration** - Connect settings context to API
3. **Embed Script** - Build public widget loader
4. **Testing** - Verify all CRUD operations work correctly 