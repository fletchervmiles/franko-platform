"use client"

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Palette, Loader2, Check, UploadCloud, InfoIcon, Edit } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image'; // Use Next.js Image component for optimization
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SketchPicker, ColorResult } from 'react-color';
import { cn } from "@/lib/utils";
// import { useSetupChecklist } from "@/contexts/setup-checklist-context";
import { useProfile } from "@/components/contexts/profile-context";
import { queryKeys } from "@/lib/queryKeys";

interface BrandingContextProps {
  userId?: string;
  initialLogoUrl?: string | null;
  initialButtonColor?: string | null;
  initialTitleColor?: string | null;
}

// Define the expected structure of the profile data returned by the API
interface UpdatedProfileBranding {
  logoUrl?: string | null;
  buttonColor?: string | null;
  titleColor?: string | null;
}

// Define the expected structure of the API response
interface ApiResponse {
  success: boolean;
  profile?: UpdatedProfileBranding;
  error?: string;
  message?: string;
}

// API mutation function
const updateBranding = async (formData: FormData): Promise<ApiResponse> => {
  const response = await fetch('/api/branding', {
    method: 'PATCH',
    body: formData,
    // Content-Type is automatically set by the browser for FormData
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update branding');
  }
  return result;
};

export function BrandingContext({
  userId,
  initialLogoUrl,
  initialButtonColor,
  initialTitleColor,
}: BrandingContextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogoUrl || null);
  const [buttonColor, setButtonColor] = useState(initialButtonColor || '#ffffff'); // Default to white
  const [titleColor, setTitleColor] = useState(initialTitleColor || '#ffffff'); // Default to white
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // const { refetchStatus: refetchSetupStatus } = useSetupChecklist();
  const { setIsBrandingComplete } = useProfile();

  // State for color picker visibility
  const [showButtonColorPicker, setShowButtonColorPicker] = useState(false);
  const [showTitleColorPicker, setShowTitleColorPicker] = useState(false);

  // Store initial values when edit mode starts, used for cancellation
  const [stagedInitialValues, setStagedInitialValues] = useState({
      logoUrl: initialLogoUrl,
      buttonColor: initialButtonColor,
      titleColor: initialTitleColor
  });

  // Update local state and reset editing when initial props change externally
  useEffect(() => {
    setLogoPreview(initialLogoUrl || null);
    setButtonColor(initialButtonColor || '#ffffff');
    setTitleColor(initialTitleColor || '#ffffff');
    setIsEditing(false); // Exit edit mode if parent data reloads
    setHasChanges(false);
    setLogoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [initialLogoUrl, initialButtonColor, initialTitleColor]);

  // Track changes *only when in edit mode*
  useEffect(() => {
    if (isEditing) {
       const colorsChanged = buttonColor !== (stagedInitialValues.buttonColor || '#ffffff') || titleColor !== (stagedInitialValues.titleColor || '#ffffff');
       setHasChanges(!!logoFile || colorsChanged);
    } else {
       setHasChanges(false); // No changes if not editing
    }
  }, [isEditing, logoFile, buttonColor, titleColor, stagedInitialValues]);

  const mutation = useMutation<ApiResponse, Error, FormData>({
    mutationFn: updateBranding,
    onSuccess: (data) => {
      setIsLoading(false)
      // Update preview URL if a new logo was uploaded and returned
      if (data.profile?.logoUrl) {
        setLogoPreview(data.profile.logoUrl);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId), refetchType: 'active' });
      toast({
        title: "Success!",
        description: "Branding updated successfully.",
      })
      // refetchSetupStatus();
      setLogoFile(null); // Clear pending file selection
      setIsEditing(false); // Exit edit mode on successful save
      setIsBrandingComplete(true); // Explicitly mark as complete on success
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update branding. Please try again.",
      });
      // Keep editing mode active on error so user can retry or cancel
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Basic validation (optional)
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
         toast({ variant: "destructive", title: "File too large", description: "Logo image must be less than 5MB." });
         event.target.value = ""; // Clear the input
         return;
      }
      if (!['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'].includes(file.type)) {
         toast({ variant: "destructive", title: "Invalid file type", description: "Please upload a PNG, JPG, GIF, or SVG image." });
         event.target.value = ""; // Clear the input
         return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handlers for react-color pickers
  const handleButtonColorChange = (color: ColorResult) => {
    setButtonColor(color.hex);
  };

  const handleTitleColorChange = (color: ColorResult) => {
    setTitleColor(color.hex);
  };

  const handleSaveChanges = () => {
    if (!userId || !isEditing) return; // Should not happen if button is disabled
    if (!hasChanges) {
       toast({ description: "No changes to save." });
       return;
    }

    const formData = new FormData();
    formData.append("userId", userId);

    // Only append changed values compared to when edit mode started
    if (logoFile) {
      formData.append("logo", logoFile);
    }
    if (buttonColor !== (stagedInitialValues.buttonColor || '#ffffff')) {
       formData.append("buttonColor", buttonColor);
    }
    if (titleColor !== (stagedInitialValues.titleColor || '#ffffff')) {
       formData.append("titleColor", titleColor);
    }

    // Check if anything actually needs to be sent
    const dataToSend = logoFile ||
                       buttonColor !== (stagedInitialValues.buttonColor || '#ffffff') ||
                       titleColor !== (stagedInitialValues.titleColor || '#ffffff');

    if (dataToSend) {
       mutation.mutate(formData);
    } else {
        // If hasChanges was true but somehow nothing is different now, just exit edit mode.
        setIsEditing(false);
    }
  };

  const handleEditClick = () => {
     // Store the current actual values when entering edit mode
     setStagedInitialValues({
         logoUrl: initialLogoUrl,
         buttonColor: initialButtonColor,
         titleColor: initialTitleColor
     });
     // Ensure current state matches initial props before editing starts
     setLogoPreview(initialLogoUrl || null);
     setButtonColor(initialButtonColor || '#ffffff');
     setTitleColor(initialTitleColor || '#ffffff');
     setLogoFile(null); // Clear any previously selected file
     if (fileInputRef.current) {
         fileInputRef.current.value = ""; // Clear file input visually
     }
     setIsEditing(true);
  }

  const handleCancelClick = () => {
     // Reset state to the values stored when edit mode started
     setLogoPreview(stagedInitialValues.logoUrl || null);
     setButtonColor(stagedInitialValues.buttonColor || '#ffffff');
     setTitleColor(stagedInitialValues.titleColor || '#ffffff');
     setLogoFile(null); // Clear any selected file during edit
     if (fileInputRef.current) {
         fileInputRef.current.value = ""; // Clear file input visually
     }
     setIsEditing(false);
     setHasChanges(false); // Ensure save button is disabled
  }

  const handleChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="rounded-[6px] border bg-[#FAFAFA] shadow-sm">
      <CardHeader className="pb-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#F5FF78] flex items-center justify-center">
                  <Palette className="h-4 w-4 text-[#1C1617]" />
                </div>
                Chat Widget Branding
              </h2>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-5 w-5 text-gray-500 cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center" className="bg-black text-white border-black max-w-xs p-2 rounded">
                    <p>Customize the appearance of the chat widget your respondents will see.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleCancelClick}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-4"
                    disabled={mutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    size="sm"
                    className="h-8 text-xs px-4 bg-[#E4F222] hover:bg-[#F5FF78] text-black"
                    disabled={mutation.isPending || !hasChanges}
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleEditClick}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-4"
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
           <p className="text-sm text-gray-500">Upload your logo and select brand colors.</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Section */}
          <div className={cn("space-y-4 bg-white rounded-lg border p-4 transition-opacity", !isEditing && "opacity-70")}>
            <Label className="text-sm font-semibold flex items-center gap-2">
               <div className="w-5 h-5 rounded-full bg-[#F5FF78] flex items-center justify-center">
                 <ImageIcon className="h-3 w-3 text-[#1C1617]" />
               </div>
               Logo
            </Label>
            <p className="text-sm text-gray-500">Upload your company logo (PNG, JPG, GIF, SVG recommended, max 5MB).</p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded border bg-gray-50 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <Image src={logoPreview} alt="Logo Preview" width={64} height={64} style={{ objectFit: 'contain' }} />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <Button
                 variant="outline"
                 size="sm"
                 onClick={handleChooseFileClick}
                 disabled={!isEditing || mutation.isPending}
                 className="h-9 text-xs px-4 flex items-center gap-2"
               >
                 <UploadCloud className="h-4 w-4" />
                 {initialLogoUrl || logoFile ? "Change Logo" : "Upload Logo"}
               </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/gif, image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
                disabled={!isEditing || mutation.isPending}
              />
            </div>
          </div>

          {/* Color Section */}
          <div className={cn("space-y-4 bg-white rounded-lg border p-4 transition-opacity", !isEditing && "opacity-70")}>
             <Label className="text-sm font-semibold flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#F5FF78] flex items-center justify-center">
                  <Palette className="h-3 w-3 text-[#1C1617]" />
                </div>
                Brand Colors
             </Label>
             <p className="text-sm text-gray-500">Choose colors for the chat widget elements.</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Button Color */}
                <div className="space-y-2">
                   <Label htmlFor="buttonColor" className="text-sm text-gray-600">Button Color</Label>
                   <Popover open={showButtonColorPicker} onOpenChange={setShowButtonColorPicker}>
                      <PopoverTrigger asChild disabled={!isEditing || mutation.isPending}>
                         <Button
                           variant="outline"
                           className={cn("w-full justify-start text-left font-normal h-10 px-2", !isEditing && "opacity-70 cursor-not-allowed")}
                           disabled={!isEditing || mutation.isPending}
                         >
                           <div className="flex items-center gap-2 w-full">
                              <div
                                 className="h-6 w-6 rounded border"
                                 style={{ backgroundColor: buttonColor }}
                              />
                              <span className="text-sm font-mono text-gray-600 flex-grow">{buttonColor}</span>
                           </div>
                         </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-none" align="start">
                         <SketchPicker
                           color={buttonColor}
                           onChangeComplete={handleButtonColorChange}
                           disableAlpha
                           presetColors={[]}
                         />
                      </PopoverContent>
                   </Popover>
                </div>
                {/* Title Color */}
                <div className="space-y-2">
                   <Label htmlFor="titleColor" className="text-sm text-gray-600">Modal Heading Color</Label>
                    <Popover open={showTitleColorPicker} onOpenChange={setShowTitleColorPicker}>
                      <PopoverTrigger asChild disabled={!isEditing || mutation.isPending}>
                         <Button
                           variant="outline"
                           className={cn("w-full justify-start text-left font-normal h-10 px-2", !isEditing && "opacity-70 cursor-not-allowed")}
                           disabled={!isEditing || mutation.isPending}
                         >
                            <div className="flex items-center gap-2 w-full">
                               <div
                                  className="h-6 w-6 rounded border"
                                  style={{ backgroundColor: titleColor }}
                               />
                               <span className="text-sm font-mono text-gray-600 flex-grow">{titleColor}</span>
                            </div>
                         </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-none" align="start">
                         <SketchPicker
                            color={titleColor}
                            onChangeComplete={handleTitleColorChange}
                            disableAlpha
                            presetColors={[]}
                         />
                      </PopoverContent>
                   </Popover>
                </div>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
