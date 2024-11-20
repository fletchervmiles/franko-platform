'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { PlayIcon, PauseIcon, DownloadIcon, Volume2Icon } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(100)
  const [speed, setSpeed] = useState(1.5)

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleProgressChange = (newValue: number[]) => {
    setProgress(newValue[0])
  }

  const handleVolumeChange = (newValue: number[]) => {
    setVolume(newValue[0])
  }

  const toggleSpeed = () => {
    const speeds = [1, 1.5, 2]
    const currentIndex = speeds.indexOf(speed)
    const nextIndex = (currentIndex + 1) % speeds.length
    setSpeed(speeds[nextIndex])
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full bg-white relative pt-4 pb-4">
      <style jsx>{`
        @keyframes ellipsis {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
          100% { content: ''; }
        }
        .animate-ellipsis::after {
          content: '';
          animation: ellipsis 1.5s infinite;
        }
      `}</style>
      <h2 className="text-sm font-semibold px-6 pb-2">Audio File</h2>
      <div className="border border-gray-200 rounded-lg mx-6 p-4 shadow-sm mb-4">
        <div className="flex flex-col items-center mb-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="outline" 
              size="icon"
              className="h-14 w-14 rounded-full bg-black hover:bg-gray-800 shadow-md"
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? 
                <PauseIcon className="h-7 w-7 text-white" /> : 
                <PlayIcon className="h-7 w-7 text-white" />
              }
            </Button>
          </motion.div>
          <p className={`mt-2 text-xs font-medium text-gray-600 ${isPlaying ? 'animate-ellipsis' : ''}`}>
            {isPlaying ? "Now Playing" : "Paused"}
          </p>
        </div>

        <div className="space-y-1 mb-4">
          <Slider 
            value={[progress]} 
            max={100} 
            step={1} 
            onValueChange={handleProgressChange}
            className="w-full relative flex items-center select-none touch-none h-3"
            aria-label="Audio progress"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(Math.floor(progress * 1.8))}</span>
            <span>{formatTime(180)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 w-1/3">
            <Volume2Icon className="h-3 w-3 text-muted-foreground" />
            <Slider 
              value={[volume]} 
              max={100} 
              step={1} 
              onValueChange={handleVolumeChange}
              aria-label="Volume"
              className="w-full relative flex items-center select-none touch-none h-3"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleSpeed}
              className="text-xs font-medium h-7 px-2"
            >
              {speed}x
            </Button>

            <Button variant="ghost" size="icon" aria-label="Download audio" className="h-7 w-7">
              <DownloadIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border"></div>
    </div>
  )
}