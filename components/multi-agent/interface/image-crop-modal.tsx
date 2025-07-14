"use client"

import React, { useState, useRef, SyntheticEvent } from "react"
import ReactCrop, {
  Crop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface ImageCropModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string | null
  onCropComplete: (croppedImageUrl: string) => void
  onImageChangeRequest: () => void
}

/**************************************
 * Utility – create the cropped image *
 **************************************/
async function createCroppedImage(
  imageSrc: string,
  pixelCrop: Crop,
  rotation = 0,
): Promise<string> {
  const image = new Image()
  image.src = imageSrc

  await new Promise((res, rej) => {
    image.onload = res
    image.onerror = rej
  })

  const canvas = document.createElement("canvas")
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get 2D context")

  // Move the origin to the centre so we rotate around the crop centre
  ctx.translate(pixelCrop.width / 2, pixelCrop.height / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-pixelCrop.width / 2, -pixelCrop.height / 2)

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  // Return base64 data URL so it persists in localStorage and previews reliably
  return canvas.toDataURL("image/png")
}

/*****************************
 * Main component definition *
 *****************************/

export function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  onImageChangeRequest,
}: ImageCropModalProps) {
  // Crop state
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop>()

  // Transform state
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const aspect = 1 // Keep the crop perfectly square / circular

  const imgRef = useRef<HTMLImageElement>(null)

  /***************
   * Handlers    *
   ***************/

  /**
   * When the image loads, create a centred 80% crop so the user starts from a sensible default
   */
  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 80,
        },
        aspect,
        width,
        height,
      ),
      width,
      height,
    )
    setCrop(initialCrop)
    setCompletedCrop(initialCrop)
  }

  /**
   * Finalise and forward the cropped image
   */
  async function handleAttachImage() {
    if (!completedCrop || !imgRef.current || !imageSrc) return

    try {
      const image = imgRef.current
      
      // Calculate the actual displayed size of the image after objectFit: contain
      const containerRect = image.getBoundingClientRect()
      const naturalAspectRatio = image.naturalWidth / image.naturalHeight
      const containerAspectRatio = containerRect.width / containerRect.height
      
      let displayedWidth, displayedHeight
      
      if (naturalAspectRatio > containerAspectRatio) {
        // Image is wider than container, so it's constrained by width
        displayedWidth = containerRect.width / zoom
        displayedHeight = (containerRect.width / naturalAspectRatio) / zoom
      } else {
        // Image is taller than container, so it's constrained by height
        displayedWidth = (containerRect.height * naturalAspectRatio) / zoom
        displayedHeight = containerRect.height / zoom
      }

      // Convert percentage crop to pixel crop using displayed dimensions
      const pixelCrop = convertToPixelCrop(
        completedCrop,
        displayedWidth,
        displayedHeight,
      )

      // Scale the crop coordinates to match the natural image size
      const scaleX = image.naturalWidth / displayedWidth
      const scaleY = image.naturalHeight / displayedHeight
      
      const naturalPixelCrop = {
        x: pixelCrop.x * scaleX,
        y: pixelCrop.y * scaleY,
        width: pixelCrop.width * scaleX,
        height: pixelCrop.height * scaleY,
      }

      const croppedImageUrl = await createCroppedImage(imageSrc, naturalPixelCrop, rotation)
      onCropComplete(croppedImageUrl)
      onClose()
    } catch (err) {
      console.error("Error while cropping:", err)
    }
  }

  if (!isOpen || !imageSrc) return null

  /****************
   * Render block *
   ****************/
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-lg bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>Add a Profile picture</DialogTitle>
        </DialogHeader>

        {/* Crop area */}
        <div className="flex flex-col items-center gap-4 p-4">
          <div
            className="relative aspect-square w-full max-w-[400px] rounded-md"
            style={{
              backgroundImage:
                "url('data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23f0f0f0\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23f0f0f0\'/%3E%3Crect x=\'10\' width=\'10\' height=\'10\' fill=\'%23e0e0e0\'/%3E%3Crect y=\'10\' width=\'10\' height=\'10\' fill=\'%23e0e0e0\'/%3E%3C/svg%3E')",
            }}
          >
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop: Crop) => setCrop(percentCrop)}
              onComplete={(c: Crop) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop
              style={{ width: "100%", height: "100%" }}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop target"
                onLoad={onImageLoad}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
              />
            </ReactCrop>
          </div>

          {/* Zoom */}
          <div className="w-full space-y-2">
            <Label htmlFor="zoom-slider">Zoom</Label>
            <Slider
              id="zoom-slider"
              min={0.5}
              max={2}
              step={0.01}
              value={[zoom]}
              onValueChange={(val) => setZoom(val[0])}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onImageChangeRequest}>
            Change image
          </Button>
          <Button onClick={handleAttachImage}>Attach image</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
