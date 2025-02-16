"use client"

// Import necessary React and icon components
import * as React from "react"
import { Save, Edit, Loader2 } from "lucide-react"

// Import custom UI components from the project
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Import necessary libraries
import { useRouter } from "next/navigation"
import { updateProfileAction, getProfileByUserIdAction } from "@/actions/profiles-actions";

// Add this component at the top of your file
const StatusDot = React.memo(({ status }: { status: 'pending' | 'complete' }) => (
  <span 
    className={`inline-block w-2 h-2 rounded-full ml-2 ${
      status === 'complete' ? 'bg-green-500' : 'bg-yellow-500'
    }`}
  />
))
StatusDot.displayName = 'StatusDot'

// Add this interface near the top of the file, after imports
interface CompanyDetailsCardProps {
  onProfileUpdate?: () => void;
  userId: string;
}

// Add these interfaces at the top of the file
interface TavilyResponse {
  success: boolean;
  content?: string;
  error?: string;
}

interface OpenAIResponse {
  success: boolean;
  description?: string;
  error?: string;
}

// Reusable Components
const LoadingSpinner = () => (
  <Loader2 className="h-4 w-4 animate-spin" />
)

// URL Validation and Formatting Utils
const validateURL = (input: string): boolean => {
  try {
    new URL(input)
    return true
  } catch {
    return false
  }
}

const formatURL = (input: string): string => {
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    return `https://${input}`
  }
  return input
}

const extractCompanyName = (url: string): string => {
  try {
    const hostname = new URL(url).hostname
    const parts = hostname.split('.')
    // Remove common TLDs and 'www'
    const filteredParts = parts.filter(part => 
      !['com', 'org', 'net', 'www'].includes(part)
    )
    return filteredParts[0] || ''
  } catch {
    return ''
  }
}

// Form Components
const URLInput = React.memo(({ 
  url, 
  isEditing, 
  onChange, 
  onSubmit 
}: { 
  url: string
  isEditing: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
}) => (
  <form onSubmit={onSubmit} className="space-y-2">
    <Label htmlFor="url">Company Website URL</Label>
    {isEditing ? (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="url"
            value={url}
            onChange={onChange}
            placeholder="https://www."
            className={`${url.length === 0 ? "pr-72" : ""}`}
          />
          {url.length === 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 text-sm font-medium animate-pulse bg-indigo-50 px-3 py-1 rounded-full">
              ✨ Step 1. Get started by submitting your company URL!
            </div>
          )}
        </div>
        <Button type="submit" size="sm">
          <Save className="h-4 w-4" />
        </Button>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{url}</span>
      </div>
    )}
  </form>
))
URLInput.displayName = 'URLInput'

const DescriptionInput = React.memo(({ 
  description, 
  isEditing, 
  onChange, 
  onSubmit 
}: { 
  description: string
  isEditing: boolean
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
}) => (
  <form onSubmit={onSubmit} className="space-y-2">
    <Label htmlFor="description">Company Description</Label>
    {isEditing ? (
      <div className="space-y-2">
        <Textarea
          id="description"
          value={description}
          onChange={onChange}
          placeholder="Enter company description"
          className="min-h-[100px]"
        />
        <Button type="submit" size="sm">
          <Save className="h-4 w-4" />
        </Button>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
    )}
  </form>
))
DescriptionInput.displayName = 'DescriptionInput'

// Main component for handling company details input
export default function CompanyDetailsCard({ 
  onProfileUpdate,
  userId
}: CompanyDetailsCardProps) {
  // State variables for managing form data and UI states
  const [url, setUrl] = React.useState("") // Stores the company URL
  const [isUrlValid, setIsUrlValid] = React.useState(false) // Tracks URL validation status
  const [isUrlSaved, setIsUrlSaved] = React.useState(false) // Tracks if URL has been saved
  const [isLoading, setIsLoading] = React.useState(false) // Tracks loading state during submission
  const [companyDescription, setCompanyDescription] = React.useState("") // Stores company description
  const [isDescriptionSaved, setIsDescriptionSaved] = React.useState(false) // Tracks if description is saved
  const [isMounted, setIsMounted] = React.useState(false) // Tracks component mount state for dialog
  const [companyName, setCompanyName] = React.useState("")
  const [isCompanyNameSaved, setIsCompanyNameSaved] = React.useState(false)
  const router = useRouter()
  const [isClient, setIsClient] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showDialog, setShowDialog] = React.useState(false)

  // Set mounted state when component mounts
  React.useEffect(() => {
    setIsMounted(true)
    setIsClient(true)
  }, [])

  // Validates URL format using regex
  const handleUrlChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setUrl(input)
    setIsUrlValid(validateURL(input))
  }, [])

  // Add this function to extract company name from domain
  const handleCompanyNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId) {
      try {
        const result = await updateProfileAction(userId, {
          companyName: companyName
        });

        if (result.status === 'success') {
          setIsCompanyNameSaved(true);
          // Call the onProfileUpdate callback if it exists
          onProfileUpdate?.();
        } else {
          throw new Error('Failed to update company name');
        }
      } catch (error) {
        console.error('Error updating company name:', error);
        alert('Failed to save company name');
      }
    }
  };

  // Handles URL form submission
  const handleUrlSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formattedURL = formatURL(url);
      if (!validateURL(formattedURL)) {
        throw new Error('Please enter a valid URL');
      }

      // Fetch company data
      const [tavilyResponse, openAIResponse] = await Promise.all([
        fetch('/api/tavily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: formattedURL })
        }).then(res => res.json()) as Promise<TavilyResponse>,
        
        fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: tavilyResponse.content })
        }).then(res => res.json()) as Promise<OpenAIResponse>
      ]);

      if (!tavilyResponse.success || !openAIResponse.success) {
        throw new Error('Failed to fetch company data');
      }

      setCompanyName(extractCompanyName(formattedURL));
      setCompanyDescription(openAIResponse.description || '');
      setIsUrlSaved(true);
      setIsCompanyNameSaved(true);
      setIsDescriptionSaved(true);
      
      // Call the onProfileUpdate callback to refresh parent components
      onProfileUpdate?.();

      // Refresh the router to ensure new data is displayed
      router.refresh();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [url, onProfileUpdate, router]);

  // Enables URL editing by resetting saved state
  const handleUrlEdit = () => {
    setIsUrlSaved(false)
  }

  // Handles company description changes
  const handleDescriptionChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCompanyDescription(e.target.value)
  }, [])

  // Handles description form submission
  const handleDescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId) {
      try {
        const result = await updateProfileAction(userId, {
          companyDescription: companyDescription
        });

        if (result.status === 'success') {
          setIsDescriptionSaved(true);
          router.refresh();
        } else {
          throw new Error('Failed to update description');
        }
      } catch (error) {
        console.error('Error updating description:', error);
        alert('Failed to save description');
      }
    }
  };

  // Enables description editing by resetting saved state
  const handleDescriptionEdit = () => {
    setIsDescriptionSaved(false)
  }

  // Add this useEffect to load initial data
  React.useEffect(() => {
    const loadProfileData = async () => {
      try {
        const result = await getProfileByUserIdAction(userId);
        if (result.status === 'success' && result.data) {
          const profile = result.data;
          
          if (profile.companyUrl) {
            setUrl(profile.companyUrl);
            setIsUrlValid(true);
            setIsUrlSaved(true);
          }
          
          if (profile.companyDescription) {
            setCompanyDescription(profile.companyDescription);
            setIsDescriptionSaved(true);
          }
          
          if (profile.companyName) {
            setCompanyName(profile.companyName);
            setIsCompanyNameSaved(true);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfileData();
  }, [userId]);

  // Error Dialog
  const ErrorDialog = React.memo(() => (
    <Dialog open={!!error} onOpenChange={() => setError(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Error</DialogTitle>
          <DialogDescription>{error}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ))
  ErrorDialog.displayName = 'ErrorDialog'

  // Component render structure
  return (
    <>
      {/* Main card container */}
      <Card className="w-full bg-white transition-all duration-300 ease-in-out p-2">
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-semibold">Company Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* URL input section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold flex items-center">
                  Website
                  <StatusDot status={isUrlSaved ? 'complete' : 'pending'} />
                </h3>
                <p className="text-sm text-muted-foreground">
                  This will be used for context by the interview agent, so it's important it's correct.
                </p>
              </div>
              {/* URL input form */}
              <URLInput
                url={url}
                isEditing={isUrlSaved}
                onChange={handleUrlChange}
                onSubmit={handleUrlSubmit}
              />
            </div>

            {/* Company Name section - no longer conditional */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold flex items-center">
                  Company or Product Name
                  <StatusDot status={isCompanyNameSaved ? 'complete' : 'pending'} />
                </h3>
                <p className="text-sm text-muted-foreground">
                Choose whether you want the interview to focus on your company as a whole or a specific product. Provide the name you'd like to use for the interview.
                </p>
              </div>
              <form onSubmit={handleCompanyNameSubmit} className="space-y-4">
                <div className="relative">
                  <Label htmlFor="companyName" className="sr-only">Company Name</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Enter company or product name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={`transition-all duration-300 ease-in-out ${isCompanyNameSaved ? "bg-gray-100/50" : ""}`}
                    disabled={isCompanyNameSaved}
                  />
                </div>
                <div className="space-x-2">
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={isCompanyNameSaved || !companyName.trim()}
                    className="transition-all duration-300 ease-in-out h-8 text-xs px-3"
                  >
                    {isCompanyNameSaved ? (
                      <>
                        <Save className="w-3 h-3 mr-0.5" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3 mr-0.5" />
                        Save
                      </>
                    )}
                  </Button>
                  {isCompanyNameSaved && (
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setIsCompanyNameSaved(false)}
                      className="transition-all duration-300 ease-in-out h-8 text-xs px-3"
                    >
                      <Edit className="w-3 h-3 mr-0.5" />
                      Edit
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Company Description section - no longer conditional */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold flex items-center">
                  Company or Product Description
                  <StatusDot status={isDescriptionSaved ? 'complete' : 'pending'} />
                </h3>
                <p className="text-sm text-muted-foreground">
                This description will help the interview agent understand your company or product for better context during the interview. Please review and edit it to ensure it's accurate and relevant.
                </p>
              </div>
              <DescriptionInput
                description={companyDescription}
                isEditing={isDescriptionSaved}
                onChange={handleDescriptionChange}
                onSubmit={handleDescriptionSubmit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading dialog (shown during URL submission) */}
      {isMounted && (
        <Dialog open={isLoading} onOpenChange={setIsLoading}>
          <DialogContent className="sm:max-w-[425px] bg-white">
            <DialogHeader>
              <DialogTitle>Processing your company URL</DialogTitle>
              <DialogDescription>
                We're analyzing your website and generating a company description. This may take a few moments.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center p-4 space-y-4">
              <LoadingSpinner />
              <p className="text-sm text-muted-foreground">
                Please don't close this window...
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ErrorDialog />
    </>
  )
}