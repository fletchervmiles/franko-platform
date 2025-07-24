"use client"

import React from "react"
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  CreditCard,
  BarChart,
  HelpCircle,
  MessageCircle,
  User,
  LogOut,
  PlusCircle,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useFeedbackModal } from "./contexts/feedback-modal-context"
import { useProfile } from "./contexts/profile-context"

const sidebarStyles = {
  "--sidebar-width": "16rem",
} as React.CSSProperties

// Function to get navigation data based on user's membership
const getNavMainData = (membership: string | null) => {
  const upgradeTitle = membership === "free" || !membership ? "Upgrade Plan" : "Plan";
  
  return [
    {
      title: "Analysis",
      items: [
        {
          title: "Responses",
          url: "/responses",
          icon: <FileText className="mr-0.5 h-4 w-4" />,
        },
        {
          title: "Chat",
          url: "/response-qa",
          icon: <MessageSquare className="mr-0.5 h-4 w-4" />,
        },
      ],
    },
    {
      title: "Agents",
      items: [
        {
          title: "Workspace",
          url: "/workspace",
          icon: <LayoutDashboard className="mr-0.5 h-4 w-4" />,
        },
        {
          title: "Context",
          url: "/context-setup",
          icon: <PlusCircle className="mr-0.5 h-4 w-4" />,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: upgradeTitle,
          url: "/upgrade",
          icon: <CreditCard className="mr-0.5 h-4 w-4" />,
        },
        {
          title: "Usage",
          url: "/usage",
          icon: <BarChart className="mr-0.5 h-4 w-4" />,
        },
        {
          title: "Support",
          url: "/support",
          icon: <HelpCircle className="mr-0.5 h-4 w-4" />,
        },
        // Feedback item removed – bubble handles feedback now
        {
          title: "Account",
          url: "/account",
          icon: <User className="mr-0.5 h-4 w-4" />,
        },
        {
          title: "Sign Out",
          url: "/signout",
          icon: <LogOut className="mr-0.5 h-4 w-4" />,
        },
      ],
    },
  ];
};

// Memoized sidebar menu item component
const SidebarMenuItemMemo = React.memo(function SidebarMenuItemComponent({ 
  item, 
  section
}: { 
  item: { title: string; url: string; icon: React.ReactNode }; 
  section: { title: string } 
}) {
  const { signOut, userId } = useAuth();
  const { openModal, setModalType } = useFeedbackModal();
  const { hasContext, contextCompleted, isLoading, highlightWorkspaceNavItem, setHighlightWorkspaceNavItem, profile } = useProfile();
  
  // Special handling for Sign Out button
  if (item.title === "Sign Out") {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="w-full justify-start text-gray-800 hover:bg-gray-100 hover:text-gray-900"
        >
          <button 
            className="flex items-center" 
            onClick={() => signOut().then(() => window.location.href = "/")}
          >
            <span className="text-gray-500">
              {item.icon}
            </span>
            <span className="ml-2 font-medium">{item.title}</span>
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Handle Feedback button with Franko
  if (item.title === "Feedback") {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="w-full justify-start text-gray-800 hover:bg-gray-100 hover:text-gray-900"
        >
          <button 
            className="flex items-center" 
            onClick={() => {
              // Set user identity for Franko
              if (userId && profile) {
                if (typeof window !== 'undefined') {
                  window.FrankoUser = {
                    user_id: userId,
                    user_metadata: {
                      name: profile.firstName && profile.secondName 
                        ? `${profile.firstName} ${profile.secondName}`.trim()
                        : profile.firstName || undefined,
                      email: profile.email || undefined
                    }
                  };
                }
              }
              
              // Open Franko modal
              if (typeof window !== 'undefined' && window.FrankoModal) {
                window.FrankoModal.open();
              }
            }}
          >
            <span className="text-gray-500">
              {item.icon}
            </span>
            <span className="ml-2 font-medium">{item.title}</span>
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Handle Support button with existing modal
  if (item.title === "Support") {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="w-full justify-start text-gray-800 hover:bg-gray-100 hover:text-gray-900"
        >
          <button 
            className="flex items-center" 
            onClick={() => {
              setModalType('support');
              openModal();
            }}
          >
            <span className="text-gray-500">
              {item.icon}
            </span>
            <span className="ml-2 font-medium">{item.title}</span>
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Handle Workspace item highlight (Step 8)
  const isWorkspaceItem = item.title === "Workspace";
  const handleWorkspaceClick = () => {
    // Reset highlight when workspace is clicked
    if (isWorkspaceItem && highlightWorkspaceNavItem) {
      setHighlightWorkspaceNavItem(false);
    }
    // no modal clearing here; ModalManager handles state reset
  };

  // Special handling for Workspace to ensure clean navigation
  if (isWorkspaceItem) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="w-full justify-start text-gray-800 hover:bg-gray-100 hover:text-gray-900"
        >
          <Link 
            href="/workspace"
            className="flex items-center relative"
            onClick={handleWorkspaceClick}
          >
            <span className="text-gray-800">
              {item.icon}
            </span>
            <span className="ml-2 font-medium">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  // Regular menu items
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="w-full justify-start text-gray-800 hover:bg-gray-100 hover:text-gray-900"
      >
        <Link 
          href={item.url.trim()} // Trim whitespace from URL
          className="flex items-center relative"
          onClick={handleWorkspaceClick} // Add onClick handler
        >
          <span
            className={`${section.title === "Account" ? "text-gray-500" : "text-gray-800"}`}
          >
            {item.icon}
          </span>
          <span className="ml-2 font-medium">{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

// Memoized sidebar section component
const SidebarSectionMemo = React.memo(function SidebarSectionComponent({
  item,
  index
}: {
  item: { title: string; items: Array<{ title: string; url: string; icon: React.ReactNode }> };
  index: number;
}) {
  return (
    <div key={item.title}>
      {index > 0 && (
        <div className="mx-3 my-4 border-t border-dotted border-gray-200 dark:border-gray-700" />
      )}
      <SidebarGroup>
        <SidebarGroupLabel className="text-sm font-semibold tracking-tight mb-2 px-3">
          {item.title}
        </SidebarGroupLabel>
        {item.items.length > 0 && (
          <SidebarGroupContent>
            <SidebarMenu>
              {item.items.map((subItem) => (
                <SidebarMenuItemMemo key={subItem.title} item={subItem} section={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        )}
      </SidebarGroup>
    </div>
  );
});

// Loading skeleton for sidebar sections
const SkeletonSection = React.memo(function SkeletonSectionComponent({ 
  section, 
  index 
}: { 
  section: { title: string; items: any[] }; 
  index: number 
}) {
  return (
    <div key={section.title}>
      {index > 0 && <div className="my-4 border-t border-dotted border-gray-200" />}
      <div className="space-y-2">
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        {section.items.map((item) => (
          <div key={item.title} className="h-8 bg-gray-200 rounded animate-pulse mt-2" />
        ))}
      </div>
    </div>
  );
});

export const NavSidebar = React.memo(function NavSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const { profile } = useProfile()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get dynamic navigation data based on user's membership
  const navMainData = getNavMainData(profile?.membership || null)

  const getPageTitle = useCallback(() => {
    // Early return if pathname is null
    if (pathname === null) return "Workspace"
    
    if (pathname === "/create") return "Create"
    if (pathname === "/responses") return "Responses"
    for (const section of navMainData) {
      const matchingItem = section.items.find((item) => {
        if (pathname === "/" && item.url === "/") return true
        if (pathname !== "/" && item.url !== "/" && pathname.startsWith(item.url)) return true
        return false
      })
      if (matchingItem) {
        return matchingItem.title
      }
    }
    return "Workspace"
  }, [pathname, navMainData])

  // Memoize the page title calculation
  const pageTitle = useMemo(() => getPageTitle(), [getPageTitle])

  if (!isMounted) {
    // Use default navigation structure for loading state
    const defaultNavData = getNavMainData(null);
    
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="w-64 bg-[#FAFAFA] border-r border-gray-200">
          <div className="h-14 border-b border-gray-200 px-3 py-2">
            <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-3 space-y-4">
            {defaultNavData.map((section, index) => (
              <SkeletonSection key={section.title} section={section} index={index} />
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <header className="h-14 border-b border-gray-200 bg-white">
            <div className="h-full px-4 flex items-center">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </header>
          <main className="h-[calc(100vh-3.5rem)] overflow-auto">{children}</main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarProvider>
        <Sidebar
          className="bg-[#FAFAFA] dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
          style={sidebarStyles}
        >
          <div
            className="fixed inset-y-0 z-10 h-full transition-[left,right,width] duration-200 ease-linear md:flex left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l bg-[#FAFAFA] dark:bg-gray-800 w-[var(--sidebar-width)] border-r border-gray-200 dark:border-gray-700"
            data-state="expanded"
            data-collapsible="offcanvas"
            data-variant="sidebar"
            data-side="left"
          >
            <div
              className="flex h-full w-full flex-col bg-[#FAFAFA] dark:bg-gray-800 group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow"
              data-sidebar="sidebar"
            >
              <SidebarHeader className="bg-[#FAFAFA] dark:bg-gray-800">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <div className="flex items-center px-3 py-2">
                      <img
                        src="/favicon/icon1.png"
                        alt="Franko logo"
                        className="h-6 w-6"
                      />
                    </div>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarHeader>
              <SidebarContent className="bg-[#FAFAFA] dark:bg-gray-800">
                <div className="space-y-4">
                  {navMainData.map((item, index) => (
                    <SidebarSectionMemo key={item.title} item={item} index={index} />
                  ))}
                </div>
              </SidebarContent>
            </div>
          </div>
        </Sidebar>
        <SidebarInset className="flex-1 overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-l-0 pr-4 pl-0 bg-white dark:bg-gray-800">
            <SidebarTrigger className="ml-2" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="h-[calc(100vh-3.5rem)] overflow-auto">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
});