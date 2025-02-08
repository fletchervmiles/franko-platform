/**
 * History Component Overview
 * 
 * A slide-out sidebar component that displays the user's chat history.
 * Features:
 * - Chat history listing
 * - New chat creation
 * - Chat deletion
 * - Loading states
 * - Mobile-responsive design
 * 
 * Data Flow:
 * 1. Fetches chat history using SWR from /api/history
 * 2. Displays chats with titles and timestamps
 * 3. Handles chat deletion via /api/chat endpoint
 * 4. Updates history on navigation or deletion
 * 
 * Key Interactions:
 * - route.ts: Handles chat deletion
 * - db/queries: Fetches chat history
 * - auth: Verifies user session
 */

"use client";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { clsx } from "clsx";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { type SelectChatInstance } from "@/db/schema/chat-instances-schema";
import { fetcher, getTitleFromChat } from "@/lib/utils";

import {
  InfoIcon,
  MenuIcon,
  MoreHorizontalIcon,
  PencilEditIcon,
  TrashIcon,
} from "./icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

/**
 * History Component
 * @param {string | null} userId - Current user ID from Clerk auth
 * 
 * State Management:
 * - isHistoryVisible: Controls sidebar visibility
 * - deleteId: Tracks chat pending deletion
 * - showDeleteDialog: Controls delete confirmation dialog
 * - SWR: Manages chat history data fetching and caching
 */
export const History = ({ userId }: { userId: string | null }) => {
  const { id } = useParams();
  const pathname = usePathname();

  // Sidebar visibility state
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  /**
   * SWR Hook for Chat History
   * - Fetches only if user is authenticated
   * - Auto-revalidates on pathname change
   * - Maintains empty array as fallback
   */
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<SelectChatInstance>>(userId ? "/api/history" : null, fetcher, {
    fallbackData: [],
  });

  // Refresh history on pathname change
  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  /**
   * Chat Deletion Handler
   * - Sends DELETE request to /api/chat
   * - Updates local history on success
   * - Shows toast notifications for feedback
   */
  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: "DELETE",
    });

    toast.promise(deletePromise, {
      loading: "Deleting chat...",
      success: () => {
        mutate((history) => {
          if (history) {
            return history.filter((h) => h.id !== id);
          }
        });
        return "Chat deleted successfully";
      },
      error: "Failed to delete chat",
    });

    setShowDeleteDialog(false);
  };

  return (
    <>
      {/* Menu Button - Toggles History Sidebar */}
      <Button
        variant="outline"
        className="p-1.5 h-fit"
        onClick={() => {
          setIsHistoryVisible(true);
        }}
      >
        <MenuIcon />
      </Button>

      {/* History Sidebar Sheet */}
      <Sheet
        open={isHistoryVisible}
        onOpenChange={(state) => {
          setIsHistoryVisible(state);
        }}
      >
        <SheetContent side="left" className="p-3 w-80 bg-muted">
          {/* Sheet Header with History Count */}
          <SheetHeader>
            <VisuallyHidden.Root>
              <SheetTitle className="text-left">History</SheetTitle>
              <SheetDescription className="text-left">
                {history === undefined ? "loading" : history.length} chats
              </SheetDescription>
            </VisuallyHidden.Root>
          </SheetHeader>

          {/* History Content */}
          <div className="text-sm flex flex-row items-center justify-between">
            <div className="flex flex-row gap-2">
              <div className="dark:text-zinc-300">History</div>

              <div className="dark:text-zinc-400 text-zinc-500">
                {history === undefined ? "loading" : history.length} chats
              </div>
            </div>
          </div>

          {/* Chat List Container */}
          <div className="mt-10 flex flex-col">
            {/* New Chat Button */}
            {userId && (
              <Button
                className="font-normal text-sm flex flex-row justify-between text-white"
                asChild
              >
                <Link href="/">
                  <div>Start a new chat</div>
                  <PencilEditIcon size={14} />
                </Link>
              </Button>
            )}

            {/* Chat List with States:
                - Not logged in message
                - No chats message
                - Loading skeleton
                - Chat list with delete options */}
            <div className="flex flex-col overflow-y-scroll p-1 h-[calc(100dvh-124px)]">
              {!userId ? (
                <div className="text-zinc-500 h-dvh w-full flex flex-row justify-center items-center text-sm gap-2">
                  <InfoIcon />
                  <div>Login to save and revisit previous chats!</div>
                </div>
              ) : null}

              {!isLoading && history?.length === 0 && userId ? (
                <div className="text-zinc-500 h-dvh w-full flex flex-row justify-center items-center text-sm gap-2">
                  <InfoIcon />
                  <div>No chats found</div>
                </div>
              ) : null}

              {isLoading && userId ? (
                <div className="flex flex-col">
                  {[44, 32, 28, 52].map((item) => (
                    <div key={item} className="p-2 my-[2px]">
                      <div
                        className={`w-${item} h-[20px] rounded-md bg-zinc-200 dark:bg-zinc-600 animate-pulse`}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {history &&
                history.map((chat) => (
                  <div
                    key={chat.id}
                    className={clsx(
                      "flex flex-row items-center gap-6 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md pr-2",
                      { "bg-zinc-200 dark:bg-zinc-700": chat.id === id },
                    )}
                  >
                    <Button
                      variant="ghost"
                      className={clsx(
                        "hover:bg-zinc-200 dark:hover:bg-zinc-700 justify-between p-0 text-sm font-normal flex flex-row items-center gap-2 pr-2 w-full transition-none",
                      )}
                      asChild
                    >
                      <Link
                        href={`/chat/${chat.id}`}
                        className="text-ellipsis overflow-hidden text-left py-2 pl-2 rounded-lg outline-zinc-900"
                      >
                        {getTitleFromChat(chat)}
                      </Link>
                    </Button>

                    <DropdownMenu modal={true}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="p-0 h-fit font-normal text-zinc-500 transition-none hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          variant="ghost"
                        >
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="left" className="z-[60]">
                        <DropdownMenuItem asChild>
                          <Button
                            className="flex flex-row gap-2 items-center justify-start w-full h-fit font-normal p-1.5 rounded-sm"
                            variant="ghost"
                            onClick={() => {
                              setDeleteId(chat.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <TrashIcon />
                            <div>Delete</div>
                          </Button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/**
 * Component States:
 * 1. Not Logged In:
 *    - Shows login prompt
 *    - Hides new chat button
 * 
 * 2. No Chats:
 *    - Shows empty state message
 *    - Shows new chat button
 * 
 * 3. Loading:
 *    - Shows skeleton UI
 *    - Maintains layout structure
 * 
 * 4. Chat List:
 *    - Shows scrollable chat history
 *    - Each chat has delete option
 *    - Highlights current chat
 * 
 * Key Features:
 * - Real-time updates with SWR
 * - Responsive mobile design
 * - Accessible UI components
 * - Smooth animations
 * - Error handling with toasts
 */
