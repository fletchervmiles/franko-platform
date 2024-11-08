"use client"

import * as React from "react"
import { Play, Pause, Save, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const voiceOptions = [
  { id: "american-female", name: "American Female", audioSrc: "/audio/american-female-francesca.mp3" },
  { id: "american-male", name: "American Male", audioSrc: "/audio/american-male-jim.mp3" },
  { id: "australian-male", name: "Australian Male", audioSrc: "/audio/australian-male-charlie.mp3" },
  { id: "british-female", name: "British Female", audioSrc: "/audio/british-female-amelia.mp3" },
]

export default function VoiceSelectionCard() {
  const [selectedVoice, setSelectedVoice] = React.useState("american-female")
  const [isSaved, setIsSaved] = React.useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = React.useState<string | null>(null)

  const audioRefs = React.useRef<{ [key: string]: HTMLAudioElement | null }>({})

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId)
    setIsSaved(false)
  }

  const handleSave = () => {
    if (selectedVoice) {
      setIsSaved(true)
      console.log("Saved voice:", selectedVoice)
      // Here you would typically send the selected voice to your backend
    }
  }

  const handleEdit = () => {
    setIsSaved(false)
  }

  const togglePlay = (voiceId: string) => {
    const audioElement = audioRefs.current[voiceId]
    if (audioElement) {
      if (currentlyPlaying === voiceId) {
        audioElement.pause()
        setCurrentlyPlaying(null)
      } else {
        if (currentlyPlaying) {
          audioRefs.current[currentlyPlaying]?.pause()
        }
        audioElement.play()
        setCurrentlyPlaying(voiceId)
      }
    }
  }

  React.useEffect(() => {
    return () => {
      // Cleanup: pause all audio when component unmounts
      Object.values(audioRefs.current).forEach(audio => audio?.pause())
    }
  }, [])

  return (
    <Card className="w-full bg-gray-50/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">Select Voice</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedVoice} onValueChange={handleVoiceSelect} className="space-y-4">
          {voiceOptions.map((voice) => (
            <div key={voice.id} className="flex items-center space-x-4">
              <RadioGroupItem value={voice.id} id={voice.id} disabled={isSaved} />
              <Label htmlFor={voice.id} className="flex-grow">{voice.name}</Label>
              <audio 
                ref={el => { audioRefs.current[voice.id] = el }}
                src={voice.audioSrc}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => togglePlay(voice.id)}
                disabled={isSaved}
              >
                {currentlyPlaying === voice.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </RadioGroup>
        <div className="mt-6 space-x-2">
          <Button
            onClick={handleSave}
            disabled={!selectedVoice || isSaved}
            className="transition-all duration-300 ease-in-out"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          {isSaved && (
            <Button
              variant="outline"
              onClick={handleEdit}
              className="transition-all duration-300 ease-in-out"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}