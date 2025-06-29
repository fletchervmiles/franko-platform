import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getModalBySlug } from "@/db/queries/modals-queries";
import { getEnabledModalChatInstances } from "@/db/queries/modal-chat-instances-queries";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { EmbedSettingsProvider } from "@/components/embed/embed-settings-provider";
import type { AppSettings } from "@/lib/settings-context";

const EmbeddedChatModal = dynamic(() => import("@/components/embed/embedded-chat-modal"), { ssr: false });

interface EmbedPageProps {
  params: { slug: string };
}

export default async function EmbedPage({ params }: EmbedPageProps) {
  const modal = await getModalBySlug(params.slug);
  if (!modal || !modal.isActive) {
    notFound();
  }

  // Get modal owner's profile to get organization name
  const profile = await getProfileByUserId(modal.userId);
  const chatInstances = await getEnabledModalChatInstances(modal.id);
  const agentIds = chatInstances.map((ci) => ci.agentType).filter((id): id is string => Boolean(id));
  const brandSettings = modal.brandSettings as AppSettings;
  const organizationName = profile?.organisationName || brandSettings?.interface?.displayName || "your product";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] p-4">
      <EmbedSettingsProvider 
        brandSettings={brandSettings}
        modal={{
          id: modal.id,
          name: modal.name,
          embedSlug: modal.embedSlug
        }}
        profile={profile}
      >
      <EmbeddedChatModal 
        agentIds={agentIds}
        displayName={brandSettings.interface.displayName}
        instructions={brandSettings.interface.instructions}
        themeOverride={brandSettings.interface.theme}
        primaryBrandColor={brandSettings.interface.primaryBrandColor}
        advancedColors={brandSettings.interface.advancedColors}
        profilePictureUrl={brandSettings.interface.profilePictureUrl}
        userMessageColor={brandSettings.interface.userMessageColor}
        chatHeaderColor={brandSettings.interface.chatHeaderColor}
        chatIconText={brandSettings.interface.chatIconText}
        chatIconColor={brandSettings.interface.chatIconColor}
        alignChatBubble={brandSettings.interface.alignChatBubble}
        isPlayground={true}
        modalId={modal.id}
        isEmbedMode={true}
        organizationName={organizationName}
      />
      </EmbedSettingsProvider>
    </div>
  );
} 