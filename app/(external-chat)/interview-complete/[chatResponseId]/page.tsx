import { notFound } from "next/navigation";
import { getChatResponseById } from "@/db/queries/chat-responses-queries";
import { CheckCircle2 } from "lucide-react";

interface InterviewCompletePageProps {
  params: {
    chatResponseId: string;
  };
}

export default async function InterviewCompletePage({ params }: InterviewCompletePageProps) {
  const { chatResponseId } = params;

  try {
    // Fetch chat response to verify it exists and is completed
    const chatResponse = await getChatResponseById(chatResponseId);
    if (!chatResponse || chatResponse.completionStatus !== "completed") {
      return notFound();
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-6 p-8 rounded-lg bg-white shadow-sm max-w-lg text-center">
          <div className="rounded-full bg-green-50 p-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Interview Complete
            </h1>
            <p className="text-gray-500">
              Thank you for participating in this conversation. Your responses have been recorded successfully.
            </p>
          </div>
          <div className="w-full h-px bg-gray-200" />
          <div className="space-y-1 text-sm text-gray-500">
            <p>Duration: {chatResponse.totalInterviewMinutes} minutes</p>
            <p>Reference ID: {chatResponse.id}</p>
          </div>
          <p className="text-xs text-gray-400">
            You can now close this window.
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading completion page:", error);
    return notFound();
  }
} 