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
import { useAuth } from "@clerk/nextjs";
import { updateProfileAction } from "@/actions/profiles-actions";

// Main component for handling company details input
export default function CompanyDetailsCard() {
  // State variables for managing form data and UI states
  const [url, setUrl] = React.useState("") // Stores the company URL
  const [isUrlValid, setIsUrlValid] = React.useState(false) // Tracks URL validation status
  const [isUrlSaved, setIsUrlSaved] = React.useState(false) // Tracks if URL has been saved
  const [isLoading, setIsLoading] = React.useState(false) // Tracks loading state during submission
  const [companyDescription, setCompanyDescription] = React.useState("") // Stores company description
  const [isDescriptionSaved, setIsDescriptionSaved] = React.useState(false) // Tracks if description is saved
  const [isMounted, setIsMounted] = React.useState(false) // Tracks component mount state for dialog
  const { userId } = useAuth();

  // Set mounted state when component mounts
  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Validates URL format using regex
  const validateURL = (input: string) => {
    const urlPattern = /^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/
    return urlPattern.test(input)
  }

  // Formats URL to ensure proper structure (adds https:// and www. if missing)
  const formatURL = (input: string) => {
    if (!input.startsWith('http://') && !input.startsWith('https://')) {
      input = 'https://' + input
    }
    if (!input.startsWith('https://www.') && !input.startsWith('http://www.')) {
      input = input.replace(/^(https?:\/\/)/, '$1www.')
    }
    return input
  }

  // Handles URL input changes and validates input
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setUrl(input)
    setIsUrlValid(validateURL(input))
  }

  // Handles URL form submission
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUrlValid && userId) {
      const formattedURL = formatURL(url);
      setUrl(formattedURL);
      setIsLoading(true);

      try {
        // First API call - Tavily
        const tavilyResponse = await fetch('/api/tavily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: formattedURL })
        });
        const tavilyData = await tavilyResponse.json();

        if (!tavilyData.success) {
          throw new Error('Failed to extract content');
        }

        // Second API call - OpenAI
        const openaiResponse = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: tavilyData.content })
        });
        const openaiData = await openaiResponse.json();

        if (!openaiData.success) {
          throw new Error('Failed to generate description');
        }

        // Update database
        const result = await updateProfileAction(userId, {
          companyUrl: formattedURL,
          companyDescription: openaiData.description
        });

        if (result.status === 'success') {
          setCompanyDescription(openaiData.description);
          setIsUrlSaved(true);
          setIsDescriptionSaved(true);
        } else {
          throw new Error('Failed to update profile');
        }

      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while processing your request');
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Please enter a valid URL");
    }
  };

  // Enables URL editing by resetting saved state
  const handleUrlEdit = () => {
    setIsUrlSaved(false)
  }

  // Handles company description changes
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCompanyDescription(e.target.value)
  }

  // Handles description form submission
  const handleDescriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsDescriptionSaved(true)
    console.log("Submitted Description:", companyDescription)
  }

  // Enables description editing by resetting saved state
  const handleDescriptionEdit = () => {
    setIsDescriptionSaved(false)
  }

  // Component render structure
  return (
    <>
      {/* Main card container */}
      <Card className="w-full bg-gray-50/50 transition-all duration-300 ease-in-out">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Your Company Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* URL input section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium">Your URL</h3>
                <p className="text-sm text-muted-foreground">
                  "This will be used for context by the interview agent, so it's important it's correct."
                </p>
              </div>
              {/* URL input form */}
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div className="relative">
                  <Label htmlFor="url" className="sr-only">Company URL</Label>
                  <Input
                    id="url"
                    type="text"
                    placeholder="https://www."
                    value={url}
                    onChange={handleUrlChange}
                    className={`transition-all duration-300 ease-in-out ${isUrlSaved ? "bg-gray-100/50" : "pr-72"}`}
                    disabled={isUrlSaved}
                  />
                  {/* Helper text for empty URL field */}
                  {!isUrlSaved && url.length === 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 text-sm animate-pulse">
                      Step 1. Get started by submitting your company URL!
                    </div>
                  )}
                </div>
                {/* URL form buttons */}
                <div className="space-x-2">
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!isUrlValid || isUrlSaved || isLoading}
                    className="transition-all duration-300 ease-in-out"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : isUrlSaved ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                  {/* Edit button shown only when URL is saved */}
                  {isUrlSaved && (
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={handleUrlEdit}
                      className="transition-all duration-300 ease-in-out"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Company description section (shown only after URL is saved) */}
            {isUrlSaved && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium">Your Company Description</h3>
                  <p className="text-sm text-muted-foreground">
                    "This company description will be used for context by the interview agent, please review and edit as needed."
                  </p>
                </div>
                {/* Description input form */}
                <form onSubmit={handleDescriptionSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="description" className="sr-only">Company Description</Label>
                    <Textarea
                      id="description"
                      placeholder="If your company description has not generated, please add it here."
                      value={companyDescription}
                      onChange={handleDescriptionChange}
                      className="min-h-[100px]"
                      disabled={isDescriptionSaved}
                    />
                  </div>
                  {/* Description form buttons */}
                  <div className="space-x-2">
                    <Button 
                      type="submit" 
                      size="sm" 
                      disabled={isDescriptionSaved || companyDescription.trim() === ""}
                      className="transition-all duration-300 ease-in-out"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    {/* Edit button shown only when description is saved */}
                    {isDescriptionSaved && (
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={handleDescriptionEdit}
                        className="transition-all duration-300 ease-in-out"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            )}
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
                "We're analyzing your website and generating a company description. This may take a few moments."
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center p-4 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                "Please don't close this window..."
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}