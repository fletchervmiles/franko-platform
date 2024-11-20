"use client"

import { User } from 'lucide-react'
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import InterviewDetails from "./interview-details"
import InterviewStatus from "./status-change"
import AudioPlayer from "./audio-player"
import FullTranscript from "./transcript"
import SummaryCard from "./summary"
import { SUMMARY_SECTIONS } from '@/constants/summaryContent'

export default function Component() {
  return (
    <Card className="flex flex-col bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-6 border-b-0 xl:border-b gap-4 sm:gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold">Fletcher Miles</h1>
        </div>
        <InterviewStatus />
      </div>
      <div className="flex flex-1">
        {/* Desktop Layout */}
        <div className="hidden w-full flex-1 flex-col xl:flex">
          <div className="flex flex-1">
            <div className="flex w-1/2 flex-col border-r">
              <div className="flex-1">
                {SUMMARY_SECTIONS && Object.values(SUMMARY_SECTIONS).map((section) => (
                  <SummaryCard 
                    key={section.title}
                    title={section.title}
                    content={section.content}
                    icon={section.icon}
                  />
                ))}
              </div>
            </div>
            <div className="flex w-1/2 flex-col">
              <div className="flex-1">
                <InterviewDetails />
                <AudioPlayer />
                <FullTranscript transcript="" />
              </div>
            </div>
          </div>
        </div>
        {/* Mobile/Tablet Layout */}
        <Tabs defaultValue="analysis" className="w-full xl:hidden">
          <div className="px-6">
            <TabsList className="w-full justify-start rounded-none bg-transparent p-0">
              <TabsTrigger
                value="analysis"
                className="relative rounded-lg px-6 py-2 font-medium text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-black"
              >
                Analysis
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="relative rounded-lg px-4 py-2 font-medium text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-black"
              >
                Details
              </TabsTrigger>
            </TabsList>
          </div>
          <Separator className="mt-2" />
          <TabsContent value="analysis" className="flex-1">
            {SUMMARY_SECTIONS && Object.values(SUMMARY_SECTIONS).map((section) => (
              <SummaryCard 
                key={section.title}
                title={section.title}
                content={section.content}
                icon={section.icon}
              />
            ))}
          </TabsContent>
          <TabsContent value="details" className="flex-1">
            <InterviewDetails />
            <AudioPlayer />
            <FullTranscript transcript="" />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  )
}