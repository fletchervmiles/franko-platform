import type { Agent } from "./agents-data";
import { agentsData } from "./agents-data";

// NOTE: This file should only be imported from client components. It contains
// the full Agent objects which embed icon components (functions) that are NOT
// serialisable across the Server ─> Client boundary.

export function getAgentById(id: string): Agent | undefined {
  return agentsData.find((a) => a.id === id);
}

export function getAgentsByIds(ids: string[]): Agent[] {
  return ids
    .map((id) => getAgentById(id))
    .filter(Boolean) as Agent[];
} 