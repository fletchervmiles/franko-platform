'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Volume2, Play, Pause, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface AudioPlayerProps {
  audioUrl: string | null
}

// Helper function to format time
const formatTime = (time: number) => {
  if (isNaN(time)) return '0:00'
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressInterval = useRef<NodeJS.Timeout>()

  // State
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(1)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)

  // Initialize audio element
  useEffect(() => {
    if (!audioUrl) return

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
    })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setProgress(0)
    })

    // Cleanup
    return () => {
      audio.remove()
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [audioUrl])

  // Handle play/pause
  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    } else {
      audioRef.current.play()
      progressInterval.current = setInterval(() => {
        if (audioRef.current) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
        }
      }, 100)
    }
    setIsPlaying(!isPlaying)
  }

  // Handle progress change
  const handleProgressChange = (values: number[]) => {
    if (!audioRef.current) return
    const newProgress = values[0]
    const time = (newProgress / 100) * duration
    audioRef.current.currentTime = time
    setProgress(newProgress)
  }

  // Handle volume change
  const handleVolumeChange = (values: number[]) => {
    if (!audioRef.current) return
    const newVolume = values[0] / 100
    audioRef.current.volume = newVolume
    setVolume(newVolume)
  }

  // Handle playback speed
  const toggleSpeed = () => {
    if (!audioRef.current) return
    const speeds = [1, 1.5, 2]
    const currentIndex = speeds.indexOf(speed)
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
    audioRef.current.playbackRate = nextSpeed
    setSpeed(nextSpeed)
  }

  // Handle download
  const handleDownload = () => {
    if (!audioUrl) return
    window.open(audioUrl, '_blank')
  }

  if (!audioUrl) {
    return null
  }

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={togglePlayback}
          className="h-8 w-8"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
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
  )
}