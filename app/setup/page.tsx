import RootLayout from "@/components/custom-ui/nav"
import URLSubmissionForm from "@/components/custom-ui/url-submit"
import VoiceSelectionCard from "@/components/custom-ui/voice-selector"
import ShareableLinkChurn from "@/components/custom-ui/shareable-link-churn"

export default function SetupPage() {
    return (
      <RootLayout>
        <div className="space-y-4">
          <URLSubmissionForm />
          <ShareableLinkChurn />
          <VoiceSelectionCard />
        </div>
      </RootLayout>
    )
}
