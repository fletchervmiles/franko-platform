'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Download, Headphones } from 'lucide-react'
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

export interface AudioPlayerProps {
  audioUrl: string | null;
}

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [speed, setSpeed] = useState(1.5)

  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl)
      
      // Set up event listeners
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0)
      })

      audioRef.current.addEventListener('timeupdate', () => {
        const currentTime = audioRef.current?.currentTime || 0
        const duration = audioRef.current?.duration || 0
        setProgress((currentTime / duration) * 100)
      })

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false)
        setProgress(0)
      })

      // Set initial volume and playback rate
      audioRef.current.volume = volume
      audioRef.current.playbackRate = 1.5
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [audioUrl])

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressChange = (newValue: number[]) => {
    if (!audioRef.current) return
    const newTime = (newValue[0] / 100) * (audioRef.current.duration || 0)
    audioRef.current.currentTime = newTime
    setProgress(newValue[0])
  }

  const handleVolumeChange = (newValue: number[]) => {
    if (!audioRef.current) return
    const newVolume = newValue[0] / 100
    audioRef.current.volume = newVolume
    setVolume(newVolume)
  }

  const toggleSpeed = () => {
    if (!audioRef.current) return
    const speeds = [1, 1.5, 2]
    const currentIndex = speeds.indexOf(speed)
    const nextIndex = (currentIndex + 1) % speeds.length
    const newSpeed = speeds[nextIndex]
    audioRef.current.playbackRate = newSpeed
    setSpeed(newSpeed)
  }

  const handleDownload = () => {
    if (audioUrl) {
      // Open in new tab instead of downloading
      window.open(audioUrl, '_blank')
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) {
      return '0:00'
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (!audioUrl) {
    return (
      <div className="w-full bg-white relative pt-4 pb-4">
        <h2 className="text-sm font-semibold px-6 pb-2 flex items-center gap-2">
          <Headphones className="h-4 w-4 text-[#f5a623]" />
          Audio File
        </h2>
        <div className="border border-gray-200 rounded-lg mx-6 p-4 shadow-sm mb-4">
          <div className="text-sm text-muted-foreground text-center">
            Audio not available
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white relative pt-4 pb-4">
      <h2 className="text-sm font-semibold px-6 pb-2 flex items-center gap-2">
        <Headphones className="h-4 w-4 text-[#f5a623]" />
        Audio File
      </h2>
      <div className="border border-gray-200 rounded-lg mx-6 p-4 shadow-sm mb-4">
        <div className="flex flex-col items-center mb-4">
          <div
            className="flex items-center justify-center h-14 w-14 rounded-full bg-black hover:bg-gray-800 shadow-md cursor-pointer"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? 
              <Pause className="h-7 w-7 text-white" /> : 
              <Play className="h-7 w-7 text-white" />
            }
          </div>
          <p className="mt-2 text-xs font-medium text-gray-600">
            {isPlaying ? "Now Playing" : "Paused"}
          </p>
        </div>

        <div className="space-y-1 mb-4">
          <Slider 
            value={[progress]} 
            max={100} 
            step={0.1} 
            onValueChange={handleProgressChange}
            className="w-full relative flex items-center select-none touch-none h-3"
            aria-label="Audio progress"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime((duration * progress) / 100)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 w-1/3">
            <Volume2 className="h-3 w-3 text-muted-foreground" />
            <Slider 
              value={[volume * 100]} 
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

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDownload}
              aria-label="Open audio in new tab" 
              className="h-7 w-7"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border"></div>
    </div>
  )
}