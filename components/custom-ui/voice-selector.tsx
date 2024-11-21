"use client"

import * as React from "react"
import { Play, Pause, Save, Edit } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { updateProfileAction } from "@/actions/profiles-actions"
import { getProfile } from "@/db/queries/profiles-queries"

const voiceOptions = [
  { 
    id: "american-female", 
    name: "Brittany (American Female)", 
    audioSrc: "/audio/american-female-brittany.mp3",
    agentName: "Brittany",
    voiceId: "kPzsL2i3teMYv0FxEYQ6"
  },
  { 
    id: "american-male", 
    name: "Jim (American Male)", 
    audioSrc: "/audio/american-male-jim.mp3",
    agentName: "Jim",
    voiceId: "UgBBYS2sOqTuMpoF3BR0"
  },
  { 
    id: "australian-male", 
    name: "Charlie (Australian Male)", 
    audioSrc: "/audio/australian-male-charlie.mp3",
    agentName: "Charlie",
    voiceId: "IKne3meq5aSn9XLyUdCD"
  },
  { 
    id: "british-female", 
    name: "Amelia (British Female)", 
    audioSrc: "/audio/british-female-amelia.mp3",
    agentName: "Amelia",
    voiceId: "ZF6FPAbjXT4488VcRRnw"
  },
]

export default function VoiceSelectionCard() {
  const { user } = useUser()
  const [selectedVoice, setSelectedVoice] = React.useState("american-female")
  const [isSaved, setIsSaved] = React.useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const audioRefs = React.useRef<{ [key: string]: HTMLAudioElement | null }>({})

  // Load saved voice preference
  React.useEffect(() => {
    const loadSavedVoice = async () => {
      if (user?.id) {
        const profile = await getProfile(user.id)
        if (profile?.agentInterviewerName) {
          const voice = voiceOptions.find(v => v.agentName === profile.agentInterviewerName)
          if (voice) {
            setSelectedVoice(voice.id)
            setIsSaved(true)
          }
        }
      }
    }
    loadSavedVoice()
  }, [user?.id])

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId)
    setIsSaved(false)
  }

  const handleSave = async () => {
    if (!user?.id || !selectedVoice) return

    setIsSaving(true)
    try {
      const selectedOption = voiceOptions.find(v => v.id === selectedVoice)
      if (!selectedOption) return

      await updateProfileAction(user.id, {
        agentInterviewerName: selectedOption.agentName,
        voiceId: selectedOption.voiceId
      })
      setIsSaved(true)
    } catch (error) {
      console.error("Error saving voice selection:", error)
    } finally {
      setIsSaving(false)
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
        audioElement.currentTime = 0
        setCurrentlyPlaying(null)
      } else {
        // Stop any currently playing audio
        if (currentlyPlaying) {
          const currentAudio = audioRefs.current[currentlyPlaying]
          currentAudio?.pause()
          currentAudio!.currentTime = 0
        }
        audioElement.play()
        setCurrentlyPlaying(voiceId)
      }
    }
  }

  // Cleanup audio on unmount
  React.useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
      })
    }
  }, [])

  return (
    <Card className="w-full bg-white p-2">
      <CardHeader className="pb-6">
        <CardTitle className="text-lg font-semibold">Select Voice</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="space-y-4">
            <RadioGroup 
              value={selectedVoice} 
              onValueChange={handleVoiceSelect} 
              className="space-y-4"
            >
              {voiceOptions.map((voice) => (
                <div key={voice.id} className="flex items-center space-x-4">
                  <RadioGroupItem 
                    value={voice.id} 
                    id={voice.id} 
                    disabled={isSaved} 
                  />
                  <Label htmlFor={voice.id} className="flex-grow">
                    {voice.name}
                  </Label>
                  <audio 
                    ref={el => { audioRefs.current[voice.id] = el }}
                    src={voice.audioSrc}
                    onEnded={() => setCurrentlyPlaying(null)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePlay(voice.id)}
                    disabled={isSaved}
                    className="h-8 text-xs px-3 transition-all duration-300 ease-in-out"
                  >
                    {currentlyPlaying === voice.id ? 
                      <Pause className="h-3 w-3 mr-0.5" /> : 
                      <Play className="h-3 w-3 mr-0.5" />
                    }
                  </Button>
                </div>
              ))}
            </RadioGroup>

            <div className="space-x-2">
              <Button
                onClick={handleSave}
                disabled={!selectedVoice || isSaved || isSaving}
                size="sm"
                className="h-8 text-xs px-3 transition-all duration-300 ease-in-out"
              >
                <Save className="w-3 h-3 mr-0.5" />
                {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
              </Button>
              {isSaved && (
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  size="sm"
                  className="h-8 text-xs px-3 transition-all duration-300 ease-in-out"
                >
                  <Edit className="w-3 h-3 mr-0.5" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
