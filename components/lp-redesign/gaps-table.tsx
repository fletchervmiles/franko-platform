"use client"

import { tableData } from "./table-data"
import {
  CheckCircle,
  BarChart2,
  Users,
  Zap,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  X,
  Map,
  Database,
} from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function GapsTable() {
  const [expandedRows, setExpandedRows] = useState<number[]>([0]) // First row expanded by default
  const [showAllRows, setShowAllRows] = useState(false)

  // Map of icons for each gap
  const gapIcons = {
    "1. Feedback Area": <Zap className="h-4 w-4 text-blue-500" />,
    "2. Channels": <MessageSquare className="h-4 w-4 text-blue-500" />,
    "3. Segmentation": <Users className="h-4 w-4 text-blue-500" />,
    "4. Metrics": <BarChart2 className="h-4 w-4 text-blue-500" />,
    "5. Roadmap": <Map className="h-4 w-4 text-blue-500" />,
    "6. Organization": <Database className="h-4 w-4 text-blue-500" />,
  }

  // Map of border colors for each gap
  const borderColors = {
    "1. Feedback Area": "border-l-gray-300",
    "2. Channels": "border-l-gray-300",
    "3. Segmentation": "border-l-gray-300",
    "4. Metrics": "border-l-gray-300",
    "5. Roadmap": "border-l-gray-300",
    "6. Organization": "border-l-gray-300",
  }

  // Function to format text with bullet points and bold keywords
  const formatBulletPoints = (text: string, isPositive = false) => {
    if (!text.includes("•")) return <p className="text-gray-900 text-base font-normal">{text}</p>

    // Split by bullet points
    const bulletPoints = text.split("•").filter((point) => point.trim() !== "")

    return (
      <ul className="list-none space-y-3">
        {bulletPoints.map((point, i) => {
          // Check if the point has bold text
          if (point.includes("**")) {
            const parts = point.split(/(\*\*.*?\*\*)/g)
            return (
              <li key={i} className="flex items-start">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${isPositive ? "bg-gray-700" : "bg-gray-400"} mt-1.5 mr-3 flex-shrink-0`}
                ></span>
                <span
                  className={`${isPositive ? "text-gray-900" : "text-gray-700"} text-xs font-normal leading-relaxed`}
                >
                  {parts.map((part, j) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return (
                        <span key={j} className={`font-medium ${isPositive ? "text-black" : "text-gray-800"}`}>
                          {part.slice(2, -2)}
                        </span>
                      )
                    }
                    return <span key={j}>{part}</span>
                  })}
                </span>
              </li>
            )
          }

          return (
            <li key={i} className="flex items-start">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${isPositive ? "bg-gray-700" : "bg-gray-400"} mt-1.5 mr-3 flex-shrink-0`}
              ></span>
              <span className={`${isPositive ? "text-gray-900" : "text-gray-700"} text-xs font-normal leading-relaxed`}>
                {point.trim()}
              </span>
            </li>
          )
        })}
      </ul>
    )
  }

  // Function to format text with bold sections
  const formatWithBold = (text: string, isPositive = false) => {
    if (!text.includes("**"))
      return (
        <p className={`${isPositive ? "text-gray-900" : "text-gray-700"} text-base font-normal leading-relaxed`}>
          {text}
        </p>
      )

    const parts = text.split(/(\*\*.*?\*\*)/g)

    return (
      <p className={`${isPositive ? "text-gray-900" : "text-gray-700"} text-base font-normal leading-relaxed`}>
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <span key={i} className={`font-medium ${isPositive ? "text-black" : "text-gray-800"}`}>
                {part.slice(2, -2)}
              </span>
            )
          }
          return <span key={i}>{part}</span>
        })}
      </p>
    )
  }

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const isRowExpanded = (index: number) => {
    return expandedRows.includes(index) || window.innerWidth >= 768
  }

  return (
    <div className="space-y-8">
      {/* Mobile-only simplified view */}
      <div className="md:hidden space-y-4">
        {tableData.map((row, index) => (
          <div key={`mobile-${index}`} className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-white border border-gray-300 flex items-center justify-center shadow-sm rounded-full">
                <span className="text-xs font-bold text-blue-500">{index + 1}</span>
              </div>
              {gapIcons[row.gap as keyof typeof gapIcons]}
              <h3 className="text-sm font-bold text-black">{row.gap.replace(/^\d+\.\s*/, "")}</h3>
            </div>
            <p className="text-sm text-gray-700">{row.title}</p>

            {/* Toggle button to show/hide details */}
            <button onClick={() => toggleRow(index)} className="mt-3 text-xs text-blue-500 flex items-center">
              {expandedRows.includes(index) ? (
                <>
                  Hide details <ChevronUp className="ml-1 h-3 w-3" />
                </>
              ) : (
                <>
                  Show details <ChevronDown className="ml-1 h-3 w-3" />
                </>
              )}
            </button>

            {/* Expandable content */}
            <AnimatePresence>
              {expandedRows.includes(index) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 pt-3 border-t border-gray-200"
                >
                  <div className="mb-3">
                    <h5 className="text-xs uppercase tracking-wider text-gray-600 mb-2 flex items-center font-medium">
                      <X className="h-3 w-3 text-red-500 mr-1" />
                      Typical Reality
                    </h5>
                    <div className="text-xs text-gray-700">
                      {row.founderTalk.includes("•") ? (
                        formatBulletPoints(row.founderTalk, false)
                      ) : (
                        <p className="italic">{row.founderTalk}</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h5 className="text-xs uppercase tracking-wider text-gray-600 mb-2 flex items-center font-medium">
                      <X className="h-3 w-3 text-red-500 mr-1" />
                      Why It Breaks
                    </h5>
                    <div className="text-xs text-gray-700">
                      {row.whyItFails.includes("•") ? (
                        formatBulletPoints(row.whyItFails, false)
                      ) : (
                        <p>{row.whyItFails}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs uppercase tracking-wider text-gray-800 mb-2 flex items-center font-medium">
                      <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                      Franko Fix
                    </h5>
                    <div className="text-xs text-gray-800">
                      {row.withFranko.includes("•")
                        ? formatBulletPoints(row.withFranko, true)
                        : formatWithBold(row.withFranko, true)}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Desktop view - hide on mobile */}
      <div className="hidden md:block">
        {/* Always show the first row */}
        <motion.div
          key={0}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`relative border-l-[3px] pl-8 md:pl-8 transition-all duration-200 ${borderColors[tableData[0].gap as keyof typeof borderColors] || "border-l-gray-300"}`}
        >
          <div className="absolute -left-2.5 top-0 w-5 h-5 bg-white border border-gray-300 flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-blue-500">1</span>
          </div>

          {/* Row header - clickable on mobile */}
          <div
            className="mb-4 flex items-center justify-between cursor-pointer md:cursor-default"
            onClick={() => toggleRow(0)}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {gapIcons[tableData[0].gap as keyof typeof gapIcons]}
                <h3 className="text-sm font-bold text-black">
                  Feedback
                  <span className="text-gray-500 mx-2">|</span>
                  <span className="font-bold text-black">{tableData[0].title}</span>
                </h3>
              </div>
            </div>
            <div className="md:hidden">
              {isRowExpanded(0) ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </div>
          </div>

          {/* Row content - collapsible on mobile */}
          <AnimatePresence>
            {isRowExpanded(0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="grid md:grid-cols-3 gap-4 mt-3"
              >
                <div className="bg-white border border-gray-300 p-6 min-h-[160px] transition-all duration-200 hover:shadow-sm rounded-sm">
                  <h5 className="text-sm uppercase tracking-wider text-gray-600 mb-4 flex items-center font-medium">
                    <X className="h-4 w-4 text-red-500 mr-2" />
                    Typical Reality
                  </h5>
                  {tableData[0].founderTalk.includes("•") ? (
                    formatBulletPoints(tableData[0].founderTalk, false)
                  ) : (
                    <p className="text-gray-700 text-base font-normal leading-relaxed italic">
                      {tableData[0].founderTalk}
                    </p>
                  )}
                </div>

                <div className="bg-white border border-gray-300 p-6 min-h-[160px] transition-all duration-200 hover:shadow-sm rounded-sm">
                  <h5 className="text-sm uppercase tracking-wider text-gray-600 mb-4 flex items-center font-medium">
                    <X className="h-4 w-4 text-red-500 mr-2" />
                    Why It Breaks
                  </h5>
                  {tableData[0].whyItFails.includes("•") ? (
                    formatBulletPoints(tableData[0].whyItFails, false)
                  ) : (
                    <p className="text-gray-700 text-base font-normal leading-relaxed">{tableData[0].whyItFails}</p>
                  )}
                </div>

                <div className="bg-white border border-gray-800 p-6 min-h-[160px] transition-all duration-200 hover:shadow-md rounded-sm">
                  <h5 className="text-sm uppercase tracking-wider text-gray-800 mb-4 flex items-center font-medium">
                    <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                    Franko Fix
                  </h5>
                  {tableData[0].withFranko.includes("•")
                    ? formatBulletPoints(tableData[0].withFranko, true)
                    : formatWithBold(tableData[0].withFranko, true)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Show all steps button */}
        {!showAllRows && (
          <div className="flex justify-center pt-8">
            <button
              onClick={() => setShowAllRows(true)}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-800 bg-white border border-gray-400 hover:bg-gray-50 hover:border-gray-500 transition-colors duration-200 rounded-sm shadow-sm"
            >
              See all steps in the loop
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
          </div>
        )}

        {/* Show remaining rows when expanded */}
        <AnimatePresence>
          {showAllRows && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, staggerChildren: 0.1 }}
              className="space-y-8"
            >
              {tableData.slice(1).map((row, index) => {
                const actualIndex = index + 1
                return (
                  <motion.div
                    key={actualIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`relative border-l-[3px] pl-8 md:pl-8 transition-all duration-200 mt-8 ${borderColors[row.gap as keyof typeof borderColors] || "border-l-gray-300"}`}
                  >
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-white border border-gray-300 flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-blue-500">{actualIndex + 1}</span>
                    </div>

                    {/* Row header - clickable on mobile */}
                    <div
                      className="mb-4 flex items-center justify-between cursor-pointer md:cursor-default"
                      onClick={() => toggleRow(actualIndex)}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {gapIcons[row.gap as keyof typeof gapIcons]}
                          <h3 className="text-sm font-bold text-black">
                            {row.gap.replace(/^\d+\.\s*/, "")}
                            <span className="text-gray-500 mx-2">|</span>
                            <span className="font-bold text-black">{row.title}</span>
                          </h3>
                        </div>
                      </div>
                      <div className="md:hidden">
                        {isRowExpanded(actualIndex) ? (
                          <ChevronUp className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                    </div>

                    {/* Row content - collapsible on mobile */}
                    <AnimatePresence>
                      {isRowExpanded(actualIndex) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="grid md:grid-cols-3 gap-4 mt-3"
                        >
                          <div className="bg-white border border-gray-300 p-6 min-h-[160px] transition-all duration-200 hover:shadow-sm rounded-sm">
                            <h5 className="text-sm uppercase tracking-wider text-gray-600 mb-4 flex items-center font-medium">
                              <X className="h-4 w-4 text-red-500 mr-2" />
                              Typical Reality
                            </h5>
                            {row.founderTalk.includes("•") ? (
                              formatBulletPoints(row.founderTalk, false)
                            ) : (
                              <p className="text-gray-700 text-base font-normal leading-relaxed italic">
                                {row.founderTalk}
                              </p>
                            )}
                          </div>

                          <div className="bg-white border border-gray-300 p-6 min-h-[160px] transition-all duration-200 hover:shadow-sm rounded-sm">
                            <h5 className="text-sm uppercase tracking-wider text-gray-600 mb-4 flex items-center font-medium">
                              <X className="h-4 w-4 text-red-500 mr-2" />
                              Why It Breaks
                            </h5>
                            {row.whyItFails.includes("•") ? (
                              formatBulletPoints(row.whyItFails, false)
                            ) : (
                              <p className="text-gray-700 text-base font-normal leading-relaxed">{row.whyItFails}</p>
                            )}
                          </div>

                          <div className="bg-white border border-gray-800 p-6 min-h-[160px] transition-all duration-200 hover:shadow-md rounded-sm">
                            <h5 className="text-sm uppercase tracking-wider text-gray-800 mb-4 flex items-center font-medium">
                              <CheckCircle className="h-3 w-3 text-green-600 mr-2" />
                              Franko Fix
                            </h5>
                            {row.withFranko.includes("•")
                              ? formatBulletPoints(row.withFranko, true)
                              : formatWithBold(row.withFranko, true)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
