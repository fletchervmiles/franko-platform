import RootLayout from "@/components/custom-ui/nav";
import CreateConversation from "@/components/custom-ui/create-conversation";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConversationsAction } from "@/actions/conversations-actions";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { SelectCreatorConversation } from "@/db/schema/conversations-schema";

export default async function ConversationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get all conversations for this user
  const { data: conversations } = await getConversationsAction(userId);

  return (
    <RootLayout>
      <div className="h-full bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Show existing conversations if any */}
          {conversations && conversations.length > 0 ? (
            <div className="grid gap-4">
              {conversations.map((conversation: SelectCreatorConversation) => (
                <Link 
                  key={conversation.id} 
                  href={`/create-conversation/${conversation.id}`}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">
                          Conversation {conversation.id.slice(0, 8)}...
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(conversation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {conversation.messages.length} messages
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <CreateConversation />
          )}

          {/* Always show create button if there are existing conversations */}
          {conversations && conversations.length > 0 && (
            <div className="mt-4">
              <CreateConversation />
            </div>
          )}
        </div>
      </div>
    </RootLayout>
  );
} 