"use client"

import * as React from "react"
import { GalleryVerticalEnd, Search } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
        },
        {
          title: "Account",
          url: "/account",
        },
        {
          title: "Logout",
          url: "#",
          onClick: (signOut: () => Promise<void>) => signOut(),
        },
      ],
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const router = useRouter()

  const getPageTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return "Your Dashboard"
      case "/account":
        return "Your Account"
      default:
        return "franko"
    }
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold font-mono">franko</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <form>
            <SidebarGroup className="py-0">
              <SidebarGroupContent className="relative">
                <Label htmlFor="search" className="sr-only">
                  Search
                </Label>
                <SidebarInput
                  id="search"
                  placeholder="Search interviews..."
                  className="pl-8"
                />
                <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
              </SidebarGroupContent>
            </SidebarGroup>
          </form>
        </SidebarHeader>
        <SidebarContent>
          {data.navMain.map((item) => (
            <SidebarGroup key={item.title}>
              <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {item.items.map((subItem) => (
                    <SidebarMenuItem key={subItem.title}>
                      {subItem.onClick ? (
                        <SidebarMenuButton 
                          onClick={async () => {
                            try {
                              // First sign out
                              await signOut()
                              // Then redirect to logout page
                              router.push("/logout")
                            } catch (error) {
                              console.error("Error during logout:", error)
                            }
                          }}
                        >
                          {subItem.title}
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton asChild>
                          <Link href={subItem.url}>{subItem.title}</Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{getPageTitle()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}