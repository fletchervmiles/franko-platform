"use client"

import * as React from "react"
import { Search, LogOut, User, LayoutDashboard, Settings, HelpCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Image from "next/image"

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

interface NavItem {
  title: string;
  url: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const data = {
  navMain: [
    {
      title: "Menu",
      items: [
        {
          title: "Dashboard",
          url: "/demo/dashboard",
          icon: <LayoutDashboard className="mr-0.5 h-4 w-4" />,
        },
        {
          title: "Setup",
          url: "/demo/setup",
          icon: <Settings className="mr-0.5 h-4 w-4" />,
        },
        {
          title: "Support",
          url: "/demo/support",
          icon: <HelpCircle className="mr-0.5 h-4 w-4" />,
        },
        {
          title: "Account",
          url: "/demo/account",
          icon: <User className="mr-0.5 h-4 w-4" />,
        },
        {
          title: "Exit Demo",
          url: "/",
          icon: <LogOut className="mr-0.5 h-4 w-4" />,
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
    if (pathname.startsWith('/demo/interview/')) {
      return "Interview Details"
    }

    switch (pathname) {
      case "/demo/dashboard":
        return "Your Dashboard"
      case "/demo/account":
        return "Your Account"
      case "/demo/setup":
        return "Setup"
      case "/demo/support":
        return "Support"
      default:
        return "franko (Demo)"
    }
  }

  return (
    <SidebarProvider>
      <Sidebar className="bg-white dark:bg-white w-[240px]">
        <div 
          className="group peer md:block text-sidebar-foreground"
          data-state="expanded" 
          data-collapsible="" 
          data-variant="sidebar" 
          data-side="left"
        >
          <div className="duration-200 relative h-svh w-[--sidebar-width] bg-white transition-[width] ease-linear group-data-[collapsible=offcanvas]:w-0 group-data-[side=right]:rotate-180 group-data-[collapsible=icon]:w-[--sidebar-width-icon] border-r border-gray-200"></div>
          <div className="duration-200 fixed inset-y-0 z-10 h-svh transition-[left,right,width] ease-linear md:flex left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l bg-white dark:bg-white w-[240px]">
            <div className="flex h-full w-full flex-col bg-white">
              <SidebarHeader className="bg-white dark:bg-white">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton size="lg">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                        <Image
                          src="/assets/franko-logo.svg"
                          alt="Franko Logo"
                          width={24}
                          height={24}
                          className="object-contain"
                          priority
                        />
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
              <SidebarContent className="bg-white dark:bg-white">
                <div>
                  {data.navMain.map((item) => (
                    <SidebarGroup key={item.title}>
                      <SidebarGroupLabel className="text-sm font-semibold tracking-tight mb-4">
                        {item.title}
                      </SidebarGroupLabel>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {item.items.map((subItem) => (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuButton 
                                asChild
                                className="w-full justify-start"
                              >
                                <Link href={subItem.url}>
                                  {subItem.icon}
                                  {subItem.title}
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  ))}
                </div>
                <div>{/* Empty div for potential future content */}</div>
              </SidebarContent>
              <SidebarRail className="bg-white dark:bg-white" />
            </div>
          </div>
        </div>
      </Sidebar>
      <SidebarInset className="shadow-none">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
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
        <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-100/75 min-h-screen shadow-none relative">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}