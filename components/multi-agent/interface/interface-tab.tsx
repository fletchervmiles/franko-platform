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
import { SketchPicker, ColorResult } from 'react-color'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { compressImage, getCompressionOptions, shouldCompress } from "@/lib/utils/image-compression"
import { toast } from "sonner"

export function InterfaceTab() {
  const { settings, updateInterfaceSettings, isSaving } = useSettings()
  const [isImageCropModalOpen, setIsImageCropModalOpen] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Helper function to validate and format hex colors
  const validateHexColor = (color: string): string => {
    // Remove any whitespace
    color = color.trim()
    
    // If empty, return empty
    if (!color) return ""
    
    // Add # if missing
    if (!color.startsWith('#')) {
      color = '#' + color
    }
    
    // Validate hex format (3 or 6 characters after #)
    const hexRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/
    if (hexRegex.test(color)) {
      return color.toUpperCase()
    }
    
    // If invalid, return the original value (let user see the error)
    return color
  }

  // Helper function to check if a color is a valid hex
  const isValidHexColor = (color: string): boolean => {
    if (!color) return true // Empty is valid (uses default)
    const hexRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/
    return hexRegex.test(color)
  }

  const handleInputChange = (field: keyof typeof settings.interface, value: string | boolean | null) => {
    updateInterfaceSettings({ [field]: value })
  }

  const handleColorChange = (color: ColorResult) => {
    handlePrimaryColorChange(color.hex)
  }

  const handlePrimaryColorChange = (color: string) => {
    const validatedColor = validateHexColor(color)
    
    if (settings.interface.advancedColors) {
      // Only update primary color if advanced mode is on
      updateInterfaceSettings({ primaryBrandColor: validatedColor })
    } else {
      // Sync all colors when not in advanced mode
      updateInterfaceSettings({
        primaryBrandColor: validatedColor,
        chatIconColor: validatedColor,
        userMessageColor: validatedColor,
        chatHeaderColor: validatedColor,
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
      // Client-side validation
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      const maxSize = 10 * 1024 * 1024 // 10MB limit for initial upload (will be compressed)

      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please select a JPEG, PNG, WebP, or GIF image.')
        event.target.value = '' // Clear the input
        return
      }

      if (file.size > maxSize) {
        toast.error('File too large. Please select an image smaller than 10MB.')
        event.target.value = '' // Clear the input
        return
      }

      // Store the file and create preview URL for cropping
      setSelectedImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string
        setSelectedImageSrc(imageSrc)
        setIsImageCropModalOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async (croppedImageDataUrl: string) => {
    if (!selectedImageFile) {
      toast.error("No image file selected")
      return
    }

    setIsUploadingImage(true)
    
    try {
      // Convert cropped data URL back to File for upload
      const response = await fetch(croppedImageDataUrl)
      const blob = await response.blob()
      const croppedFile = new File([blob], `cropped_${selectedImageFile.name}`, {
        type: 'image/png',
        lastModified: Date.now()
      })

      // Compress the cropped image if needed
      let finalFile = croppedFile
      if (shouldCompress(croppedFile)) {
        const compressionOptions = getCompressionOptions(croppedFile)
        finalFile = await compressImage(croppedFile, compressionOptions)
      }

      // Upload to server
      const formData = new FormData()
      formData.append('file', finalFile)

      const uploadResponse = await fetch('/api/profile-picture/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadData = await uploadResponse.json()
      
      // Update the profile picture URL in settings
      handleInputChange("profilePictureUrl", uploadData.url)
      
      // Close modal and clean up
      setIsImageCropModalOpen(false)
      setSelectedImageSrc(null)
      setSelectedImageFile(null)
      
      toast.success("Profile picture updated successfully")

    } catch (error: any) {
      console.error('Image upload error:', error)
      toast.error(error.message || "Failed to upload image")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    handleInputChange("profilePictureUrl", null)
    setSelectedImageSrc(null)
    setSelectedImageFile(null)
  }

  const enabledAgents = settings.agents.enabledAgents
  const activeAgents = agentsData.filter((agent) => enabledAgents[agent.id])

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-[#FAFAFA] dark:bg-gray-800">
      {/* Full-width Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold mb-2 text-gray-900">Modal Design</h2>
            <p className="text-sm text-slate-600">
              Edit your chat modal to match your brand.
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
          {/* Group 1: Profile, Theme, Brand Color, Advanced Colors */}
          <Card className="p-4">
            <div className="space-y-4">
              {/* Profile Picture */}
              <div className="space-y-4">
                <Label htmlFor="profile-picture">Profile Picture (Optional)</Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={settings.interface.profilePictureUrl || undefined} alt="Profile Picture" />
                      <AvatarFallback>
                        <UserIcon className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("profile-picture-input")?.click()}
                      disabled={isUploadingImage}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploadingImage ? "Uploading..." : "Upload"}
                    </Button>
                    {settings.interface.profilePictureUrl && !isUploadingImage && (
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
                    disabled={isUploadingImage}
                  />
                </div>
                {isUploadingImage && (
                  <p className="text-xs text-gray-500">
                    Compressing and uploading image...
                  </p>
                )}
                {!isUploadingImage && (
                  <p className="text-xs text-gray-500">
                    Supports JPEG, PNG, WebP, and GIF. Max 10MB. Images will be compressed and cropped to fit.
                  </p>
                )}
              </div>
              {/* Theme */}
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
              {/* Brand Color */}
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
                <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-10 px-2"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="h-6 w-6 rounded border"
                          style={{ backgroundColor: settings.interface.primaryBrandColor || '#ffffff' }}
                        />
                        <span className="text-sm font-mono text-gray-600 flex-grow">
                          {settings.interface.primaryBrandColor || '#ffffff'}
                        </span>
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-none" align="start">
                    <SketchPicker
                      color={settings.interface.primaryBrandColor || '#ffffff'}
                      onChangeComplete={handleColorChange}
                      disableAlpha
                      presetColors={[]}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-500">
                  Set a custom brand color for your modal. Hit reset to use theme defaults (white header for light mode, dark header for dark mode).
                </p>
              </div>
              {/* Advanced Colors Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Advanced Color Controls</Label>
                  <Switch
                    checked={settings.interface.advancedColors}
                    onCheckedChange={handleAdvancedToggle}
                    className="data-[state=checked]:bg-[#E4F222]"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enable to customize header, message, and icon colors individually.
                </p>
              </div>
              {/* Individual Color Controls - Only show when advanced is enabled */}
              {settings.interface.advancedColors && (
                <>
                  {/* Chat Header Color */}
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-10 px-2"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div
                              className="h-6 w-6 rounded border"
                              style={{ backgroundColor: settings.interface.chatHeaderColor || settings.interface.primaryBrandColor || '#ffffff' }}
                            />
                            <span className="text-sm font-mono text-gray-600 flex-grow">
                              {settings.interface.chatHeaderColor || settings.interface.primaryBrandColor || '#ffffff'}
                            </span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-none" align="start">
                        <SketchPicker
                          color={settings.interface.chatHeaderColor || settings.interface.primaryBrandColor || '#ffffff'}
                          onChangeComplete={(color) => handleInputChange("chatHeaderColor", color.hex)}
                          disableAlpha
                          presetColors={[]}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* Chat Icon Color */}
                  <div className="space-y-2">
                    <Label htmlFor="chat-icon-color">Feedback Icon Color</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-10 px-2"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div
                              className="h-6 w-6 rounded border"
                              style={{ backgroundColor: settings.interface.chatIconColor || '#ffffff' }}
                            />
                            <span className="text-sm font-mono text-gray-600 flex-grow">
                              {settings.interface.chatIconColor || '#ffffff'}
                            </span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-none" align="start">
                        <SketchPicker
                          color={settings.interface.chatIconColor || '#ffffff'}
                          onChangeComplete={(color) => handleInputChange("chatIconColor", color.hex)}
                          disableAlpha
                          presetColors={[]}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* User Message Color - COMMENTED OUT - UI removed but can be restored later */}
                  {/* <div className="space-y-2">
                    <Label htmlFor="user-message-color">User Message Color</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-10 px-2"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div
                              className="h-6 w-6 rounded border"
                              style={{ backgroundColor: settings.interface.userMessageColor || '#ffffff' }}
                            />
                            <span className="text-sm font-mono text-gray-600 flex-grow">
                              {settings.interface.userMessageColor || '#ffffff'}
                            </span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-none" align="start">
                        <SketchPicker
                          color={settings.interface.userMessageColor || '#ffffff'}
                          onChangeComplete={(color) => handleInputChange("userMessageColor", color.hex)}
                          disableAlpha
                          presetColors={[]}
                        />
                      </PopoverContent>
                    </Popover>
                  </div> */}
                </>
              )}
            </div>
          </Card>

          {/* Group 2: Display Name and Additional Text */}
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={settings.interface.displayName}
                  onChange={(e) => handleInputChange("displayName", e.target.value)}
                  placeholder="We'd love your feedback"
                />
              </div>
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
            </div>
          </Card>

          {/* Group 3: Floating Chat Button Text and Position */}
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chat-icon-text">Floating Chat Button Text</Label>
                <Input
                  id="chat-icon-text"
                  value={settings.interface.chatIconText}
                  onChange={(e) => handleInputChange("chatIconText", e.target.value)}
                  placeholder="Feedback"
                />
              </div>
              <div className="space-y-4">
                <Label>Floating Chat Button Position</Label>
                <Select
                  value={settings.interface.alignChatBubble}
                  onValueChange={(value: "left" | "right" | "custom") => handleInputChange("alignChatBubble", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left Aligned</SelectItem>
                    <SelectItem value="right">Right Aligned</SelectItem>
                    <SelectItem value="custom">Hide Preview Button</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  In the Connect tab, you can choose to embed a floating chat button or a custom trigger to launch your modal. A custom trigger is your own linked button.
                </p>
              </div>
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
            displayMode="modal"
          />
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={isImageCropModalOpen}
        onClose={() => {
          setIsImageCropModalOpen(false)
          setSelectedImageSrc(null)
          setSelectedImageFile(null)
        }}
        imageSrc={selectedImageSrc}
        onCropComplete={handleCropComplete}
        onImageChangeRequest={() => {
          setIsImageCropModalOpen(false)
          setSelectedImageSrc(null)
          setSelectedImageFile(null)
          document.getElementById("profile-picture-input")?.click()
        }}
      />
    </div>
  )
}
