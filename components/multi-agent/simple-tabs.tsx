"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AgentsTab } from "./agents/agents-tab"
import { InterfaceTab } from "./interface/interface-tab"
import ConnectTab from "./connect/connect-tab"
import { PlaygroundTab } from "./playground/playground-tab"
import { useSearchParams, useRouter } from "next/navigation"

export default function SimpleTabs() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialTabParam = searchParams?.get("tab") || null
  const validValues = ["agents", "interface", "connect", "playground", "integrations"] as const
  const defaultTab = validValues.includes(initialTabParam as any) ? (initialTabParam as string) : "agents"

  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (searchParams) {
      const params = new URLSearchParams(searchParams.toString())
      if (value === "agents") {
        params.delete("tab") // default
      } else {
        params.set("tab", value)
      }
      router.replace(`?${params.toString()}`)
    }
  }

  const tabs = [
    { label: "Agents", value: "agents" },
    { label: "Interface", value: "interface" },
    { label: "Connect", value: "connect" },
    { label: "Playground", value: "playground" },
    { label: "Integrations", value: "integrations" },
  ]

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start border-b dark:border-gray-700 rounded-none h-12 bg-transparent p-0">
        {tabs.map(({ label, value }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="relative rounded-none border-b-2 border-transparent px-6 h-12 mr-8
                       data-[state=active]:border-black data-[state=active]:dark:border-white data-[state=active]:shadow-none
                       hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 ease-in-out
                       data-[state=active]:text-black data-[state=active]:dark:text-white text-gray-500 dark:text-gray-400"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="mt-6">
        <TabsContent value="agents" className="mt-0">
          <AgentsTab />
        </TabsContent>

        <TabsContent value="interface" className="mt-0">
          <InterfaceTab />
        </TabsContent>

        <TabsContent value="connect" className="mt-0">
          <ConnectTab />
        </TabsContent>

        <TabsContent value="playground" className="mt-0">
          <PlaygroundTab />
        </TabsContent>

        <TabsContent value="integrations" className="mt-0">
          <div className="p-6 rounded-lg bg-white dark:bg-gray-850 border dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">Integrations content goes here.</p>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  )
}
