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
import { cn } from "@/lib/utils"; // Import cn for conditional classes

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      toast({
        title: "Success!",
        description: "Branding updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      setIsEditing(false); // Exit edit mode on successful save
      // Let the useEffect above handle state reset based on invalidated query data
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
                <Palette className="h-4 w-4 text-blue-500" /> Chat Widget Branding
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
                    className="h-8 text-xs px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
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
            <Label className="text-base font-semibold flex items-center gap-2">
               <ImageIcon className="h-4 w-4 text-blue-500" /> Logo
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
             <Label className="text-base font-semibold flex items-center gap-2">
                <Palette className="h-4 w-4 text-blue-500" /> Brand Colors
             </Label>
             <p className="text-sm text-gray-500">Choose colors for the chat widget elements.</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Button Color */}
                <div className="space-y-2">
                   <Label htmlFor="buttonColor" className="text-sm font-medium">Button Color</Label>
                   <div className="flex items-center gap-2 border rounded-md bg-[#FAFAFA] pr-2">
                      <Input
                         id="buttonColor"
                         type="color"
                         value={buttonColor}
                         onChange={(e) => setButtonColor(e.target.value)}
                         className="w-10 h-10 p-0 border-none rounded-l-md cursor-pointer"
                         disabled={!isEditing || mutation.isPending}
                         style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                      />
                      <span className="text-sm font-mono text-gray-600">{buttonColor}</span>
                   </div>
                </div>
                {/* Title Color */}
                <div className="space-y-2">
                   <Label htmlFor="titleColor" className="text-sm font-medium">Title Color</Label>
                   <div className="flex items-center gap-2 border rounded-md bg-[#FAFAFA] pr-2">
                      <Input
                         id="titleColor"
                         type="color"
                         value={titleColor}
                         onChange={(e) => setTitleColor(e.target.value)}
                         className="w-10 h-10 p-0 border-none rounded-l-md cursor-pointer"
                         disabled={!isEditing || mutation.isPending}
                         style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                      />
                      <span className="text-sm font-mono text-gray-600">{titleColor}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
