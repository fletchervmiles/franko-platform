"use client"

import { Trash2, Edit2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import InterviewStatus from "./interview-status"
import { useState, useEffect } from "react"
import Link from "next/link"

interface Workspace {
  id: string
  guideName: string
  status: "new responses" | "reviewed"
  lastEdited: string
  responses: number
  customerWords: number
}

// Sample data - replace with actual data fetching
const workspaces: Workspace[] = [
  {
    id: "4wffc6nnh",
    guideName: "InterviewGuide01 - Churn",
    status: "new responses",
    lastEdited: "2023-05-15",
    responses: 10,
    customerWords: 133,
  },
  {
    id: "chb1oqiqv",
    guideName: "InterviewGuide02 - Product Feedback",
    status: "reviewed",
    lastEdited: "2023-04-01",
    responses: 102,
    customerWords: 3944,
  },
  {
    id: "pz7khu6p9",
    guideName: "InterviewGuide03 - Churn",
    status: "new responses",
    lastEdited: "2023-03-10",
    responses: 2342,
    customerWords: 39439,
  },
]

export function WorkspaceList() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 100) // 100ms delay

    return () => clearTimeout(timer)
  }, [])

  const handleDelete = (id: string) => {
    console.log(`Delete workspace with id: ${id}`)
    // Implement delete logic here
  }

  const handleRename = (id: string) => {
    console.log(`Rename workspace with id: ${id}`)
    // Implement rename logic here
  }

  if (!isMounted) {
    return null // or a loading placeholder
  }

  return (
    <div className="w-full p-4 md:p-8 lg:p-12 space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black">Workspace</h1>
          <div className="flex items-center gap-2">
            <Link href="/create">
              <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                <Plus className="mr-1 h-3 w-3" />
                Create Conversation
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-[6px] border bg-white shadow-sm">
        {workspaces.map((workspace, index) => (
          <Link
            href={`/conversations/${encodeURIComponent(workspace.guideName)}`}
            key={workspace.id}
            className={`flex flex-col gap-4 p-4 hover:bg-muted/50 lg:grid lg:grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] lg:items-center ${
              index !== workspaces.length - 1 ? "border-b" : ""
            }`}
          >
            <span className="text-sm font-semibold text-foreground order-1">{workspace.guideName}</span>
            <div className="order-2 w-full lg:w-auto">
              <InterviewStatus initialStatus={workspace.status} />
            </div>
            <div className="order-3">
              <span className="text-sm text-muted-foreground">Responses</span>
              <p className="text-sm font-light text-foreground">{workspace.responses.toLocaleString()}</p>
            </div>
            <div className="order-4">
              <span className="text-sm text-muted-foreground">Customer Words</span>
              <p className="text-sm font-light text-foreground">{workspace.customerWords.toLocaleString()}</p>
            </div>
            <div className="order-5">
              <span className="text-sm text-muted-foreground">Last Edited</span>
              <p className="text-sm font-light text-foreground">{workspace.lastEdited}</p>
            </div>
            <div className="flex items-center gap-3 order-6">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Rectangle%201-zNq3ZeSKpAcDWZtxAfVWG0VVquUKB2.svg"
                className="h-6 w-6 rounded-full"
                alt="User avatar"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <span className="sr-only">Open menu</span>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                    >
                      <path
                        d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRename(workspace.id)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(workspace.id)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

