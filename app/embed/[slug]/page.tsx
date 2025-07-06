import { notFound } from "next/navigation";
import { getModalBySlug } from "@/db/queries/modals-queries";
import { getEnabledModalChatInstances } from "@/db/queries/modal-chat-instances-queries";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { EmbedSettingsProvider } from "@/components/embed/embed-settings-provider";
import { EmbedPageClient } from "./embed-page-client";
import type { AppSettings } from "@/lib/settings-context";

interface EmbedPageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function EmbedPage({ params, searchParams }: EmbedPageProps) {
  const modal = await getModalBySlug(params.slug);
  if (!modal || !modal.isActive) {
    notFound();
  }

  // Get modal owner's profile to get organization name
  const profile = await getProfileByUserId(modal.userId);
  const chatInstances = await getEnabledModalChatInstances(modal.id);
  const brandSettings = modal.brandSettings as AppSettings;
  
  // Filter by brandSettings.agents.enabledAgents
  const enabledAgents = brandSettings?.agents?.enabledAgents || {};
  const filteredChatInstances = chatInstances.filter(instance => 
    instance.agentType && enabledAgents[instance.agentType] === true
  );
  const agentIds = filteredChatInstances.map((ci) => ci.agentType).filter((id): id is string => Boolean(id));
  const organizationName = profile?.organisationName || brandSettings?.interface?.displayName || "your product";

  const displayMode = searchParams?.mode === "modal" ? "modal" : "standalone"

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: displayMode === "standalone" ? "#F9F8F6" : "transparent" }}
    >
      <EmbedSettingsProvider 
        brandSettings={brandSettings}
        modal={{
          id: modal.id,
          name: modal.name,
          embedSlug: modal.embedSlug
        }}
        profile={profile}
      >
        <EmbedPageClient 
          modal={modal}
          agentIds={agentIds}
          brandSettings={brandSettings}
          organizationName={organizationName}
          displayMode={displayMode}
        />
      </EmbedSettingsProvider>
    </div>
  );
} 