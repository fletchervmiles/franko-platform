"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, UserIcon, Check } from "lucide-react"
import { useSettings } from "@/lib/settings-context"
import { ImageCropModal } from "./image-crop-modal"
import { WidgetPreview } from "../agents/widget-preview"
import { agentsData } from "@/lib/agents-data"

export function InterfaceTab() {
  const { settings, updateInterfaceSettings, isSaving } = useSettings()
  const [isImageCropModalOpen, setIsImageCropModalOpen] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)

  const handleInputChange = (field: keyof typeof settings.interface, value: string | boolean | null) => {
    updateInterfaceSettings({ [field]: value })
  }

  const handlePrimaryColorChange = (color: string) => {
    if (settings.interface.advancedColors) {
      // Only update primary color if advanced mode is on
      handleInputChange("primaryBrandColor", color)
    } else {
      // Sync all colors when not in advanced mode
      updateInterfaceSettings({
        primaryBrandColor: color,
        chatIconColor: color,
        userMessageColor: color,
        chatHeaderColor: color,
      })
    }
  }

  const resetToThemeDefaults = () => {
    // Reset to empty strings so theme defaults are used
    updateInterfaceSettings({
      primaryBrandColor: "",
      chatIconColor: "",
      userMessageColor: "",
      chatHeaderColor: null,
      advancedColors: false
    })
  }

  const handleAdvancedToggle = (enabled: boolean) => {
    if (!enabled) {
      // When turning off advanced mode, sync all colors to primary
      updateInterfaceSettings({
        advancedColors: false,
        chatIconColor: settings.interface.primaryBrandColor,
        userMessageColor: settings.interface.primaryBrandColor,
        chatHeaderColor: settings.interface.primaryBrandColor,
      })
    } else {
      updateInterfaceSettings({ advancedColors: enabled })
    }
  }

  const resetToBrandColor = () => {
    updateInterfaceSettings({
      chatIconColor: settings.interface.primaryBrandColor,
      userMessageColor: settings.interface.primaryBrandColor,
      chatHeaderColor: settings.interface.primaryBrandColor,
    })
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string
        setSelectedImageSrc(imageSrc)
        setIsImageCropModalOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedImageUrl: string) => {
    handleInputChange("profilePictureUrl", croppedImageUrl)
    setIsImageCropModalOpen(false)
    setSelectedImageSrc(null)
  }

  const handleRemoveImage = () => {
    handleInputChange("profilePictureUrl", null)
  }

  const enabledAgents = settings.agents.enabledAgents
  const activeAgents = agentsData.filter((agent) => enabledAgents[agent.id])

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-[#FAFAFA] dark:bg-gray-800">
      {/* Full-width Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold mb-2 text-gray-900">Interface Design</h2>
            <p className="text-sm text-slate-600">
              Customize how your chat widget looks and feels to match your brand.
            </p>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-[#1C1617] text-sm font-medium">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#E4F222] border-t-transparent"></div>
              Saving...
            </div>
          )}
        </div>
      </div>

      {/* Two-column content below the header */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column - Interface Controls */}
        <div className="space-y-6">
        {/* Profile Picture */}
        <Card className="p-4">
          <div className="space-y-4">
            <Label htmlFor="profile-picture">Profile Picture (Optional)</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={settings.interface.profilePictureUrl || undefined} alt="Profile Picture" />
                <AvatarFallback>
                  <UserIcon className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("profile-picture-input")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                {settings.interface.profilePictureUrl && (
                  <Button variant="outline" size="sm" onClick={handleRemoveImage}>
                    Remove
                  </Button>
                )}
              </div>
              <input
                id="profile-picture-input"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
        </Card>

        {/* Display Name */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={settings.interface.displayName}
              onChange={(e) => handleInputChange("displayName", e.target.value)}
              placeholder="We'd love your feedback"
            />
          </div>
        </Card>

        {/* Additional Text */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">Additional Text</Label>
            <Textarea
              id="instructions"
              value={settings.interface.instructions}
              onChange={(e) => handleInputChange("instructions", e.target.value)}
              placeholder="Select a topic below. Each chat is short and sharp, ≈1-3 minutes."
              rows={3}
            />
          </div>
        </Card>

        {/* Theme */}
        <Card className="p-4">
          <div className="space-y-4">
            <Label>Theme</Label>
            <Select
              value={settings.interface.theme}
              onValueChange={(value: "light" | "dark") => handleInputChange("theme", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Chat Icon Text */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label htmlFor="chat-icon-text">Chat Icon Text</Label>
            <Input
              id="chat-icon-text"
              value={settings.interface.chatIconText}
              onChange={(e) => handleInputChange("chatIconText", e.target.value)}
              placeholder="Feedback"
            />
          </div>
        </Card>

        {/* Brand Color */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="primary-brand-color">Brand Color</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={resetToThemeDefaults}
                className="text-xs"
              >
                Reset to Defaults
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="primary-brand-color"
                value={settings.interface.primaryBrandColor || "#ffffff"}
                onChange={(e) => handlePrimaryColorChange(e.target.value)}
                className="w-12 h-8 rounded border border-gray-300"
              />
              <Input
                value={settings.interface.primaryBrandColor}
                onChange={(e) => handlePrimaryColorChange(e.target.value)}
                placeholder="Leave empty for theme default"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500">
              Set a custom brand color for your chat interface. Leave empty to use theme defaults (white header for light mode, dark header for dark mode).
            </p>
          </div>
        </Card>

        {/* Advanced Colors Toggle */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Advanced Color Controls</Label>
              <Switch
                checked={settings.interface.advancedColors}
                onCheckedChange={handleAdvancedToggle}
              />
            </div>
            <p className="text-xs text-gray-500">
              Enable to customize header, message, and icon colors individually.
            </p>
          </div>
        </Card>

        {/* Individual Color Controls - Only show when advanced is enabled */}
        {settings.interface.advancedColors && (
          <>
            {/* Chat Header Color */}
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="chat-header-color">Modal Header Color</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetToBrandColor}
                    className="text-xs"
                  >
                    Reset to Brand Color
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="chat-header-color"
                    value={settings.interface.chatHeaderColor || settings.interface.primaryBrandColor}
                    onChange={(e) => handleInputChange("chatHeaderColor", e.target.value)}
                    className="w-12 h-8 rounded border border-gray-300"
                  />
                  <Input
                    value={settings.interface.chatHeaderColor || settings.interface.primaryBrandColor}
                    onChange={(e) => handleInputChange("chatHeaderColor", e.target.value)}
                    placeholder=""
                    className="flex-1"
                  />
                </div>
              </div>
            </Card>

            {/* Chat Icon Color */}
            <Card className="p-4">
              <div className="space-y-2">
                <Label htmlFor="chat-icon-color">Feedback Icon Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="chat-icon-color"
                    value={settings.interface.chatIconColor}
                    onChange={(e) => handleInputChange("chatIconColor", e.target.value)}
                    className="w-12 h-8 rounded border border-gray-300"
                  />
                  <Input
                    value={settings.interface.chatIconColor}
                    onChange={(e) => handleInputChange("chatIconColor", e.target.value)}
                    placeholder=""
                    className="flex-1"
                  />
                </div>
              </div>
            </Card>

            {/* User Message Color */}
            <Card className="p-4">
              <div className="space-y-2">
                <Label htmlFor="user-message-color">User Message Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="user-message-color"
                    value={settings.interface.userMessageColor}
                    onChange={(e) => handleInputChange("userMessageColor", e.target.value)}
                    className="w-12 h-8 rounded border border-gray-300"
                  />
                  <Input
                    value={settings.interface.userMessageColor}
                    onChange={(e) => handleInputChange("userMessageColor", e.target.value)}
                    placeholder=""
                    className="flex-1"
                  />
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Chat Icon Position */}
        <Card className="p-4">
          <div className="space-y-4">
            <Label>Chat Icon Position</Label>
            <Select
              value={settings.interface.alignChatBubble}
              onValueChange={(value: "left" | "right" | "custom") => handleInputChange("alignChatBubble", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left aligned - Auto chat icon</SelectItem>
                <SelectItem value="right">Right aligned - Auto chat icon</SelectItem>
                <SelectItem value="custom">Custom button - No auto icon</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Choose "Custom button" if you want to trigger the modal from your own website button instead of showing an automatic floating chat icon.
            </p>
          </div>
        </Card>
        </div>

        {/* Right Column - Live Widget Preview */}
        <div className="hidden md:block">
          <WidgetPreview
            activeAgents={activeAgents}
            displayName={settings.interface.displayName}
            instructions={settings.interface.instructions}
            themeOverride={settings.interface.theme}
            primaryBrandColor={settings.interface.primaryBrandColor}
            advancedColors={settings.interface.advancedColors}
            chatIconText={settings.interface.chatIconText}
            chatIconColor={settings.interface.chatIconColor}
            profilePictureUrl={settings.interface.profilePictureUrl}
            userMessageColor={settings.interface.userMessageColor}
            chatHeaderColor={settings.interface.chatHeaderColor}
            alignChatBubble={settings.interface.alignChatBubble}
          />
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={isImageCropModalOpen}
        onClose={() => {
          setIsImageCropModalOpen(false)
          setSelectedImageSrc(null)
        }}
        imageSrc={selectedImageSrc}
        onCropComplete={handleCropComplete}
        onImageChangeRequest={() => {
          setIsImageCropModalOpen(false)
          setSelectedImageSrc(null)
          document.getElementById("profile-picture-input")?.click()
        }}
      />
    </div>
  )
}
