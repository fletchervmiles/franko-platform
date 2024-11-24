# Tast 1 - Review

Review the following tasks.

# Task 2 - Update the URL Submit Component

- Add Field for Company or Product Name
  - Add a new single-line input field to the URL Submit component.
  - Label: "Company or Product Name".
  - Subtext: "This should be your company name or a specific product that you want to be the focus of the churn interview."
  - Ensure this field is part of the form submission logic.

Here's the component:

`components\custom-ui\url-submit.tsx`

```typescript
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
import { updateProfileAction, getProfileByUserIdAction } from "@/actions/profiles-actions";

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
  const handleDescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId) {
      try {
        const result = await updateProfileAction(userId, {
          companyDescription: companyDescription
        });

        if (result.status === 'success') {
          setIsDescriptionSaved(true);
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
      if (userId) {
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
        }
      }
    };

    loadProfileData();
  }, [userId]);

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
                <h3 className="text-sm font-semibold">Website</h3>
                <p className="text-sm text-muted-foreground">
                  This will be used for context by the interview agent, so it's important it's correct.
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
                    className="transition-all duration-300 ease-in-out h-8 text-xs px-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-0.5" />
                        Saving...
                      </>
                    ) : isUrlSaved ? (
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
                  {/* Edit button shown only when URL is saved */}
                  {isUrlSaved && (
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={handleUrlEdit}
                      className="transition-all duration-300 ease-in-out h-8 text-xs px-3"
                    >
                      <Edit className="w-3 h-3 mr-0.5" />
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
                  <h3 className="text-sm font-semibold">Company Description</h3>
                  <p className="text-sm text-muted-foreground">
                    This company description will be used for context by the interview agent, please review and edit as needed.
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
                  <div className="space-x-2">
                    <Button 
                      type="submit" 
                      size="sm" 
                      disabled={isDescriptionSaved || companyDescription.trim() === ""}
                      className="transition-all duration-300 ease-in-out h-8 text-xs px-3"
                    >
                      <Save className="w-3 h-3 mr-0.5" />
                      Saved
                    </Button>
                    {isDescriptionSaved && (
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={handleDescriptionEdit}
                        className="transition-all duration-300 ease-in-out h-8 text-xs px-3"
                      >
                        <Edit className="w-3 h-3 mr-0.5" />
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
                We're analyzing your website and generating a company description. This may take a few moments.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center p-4 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Please don't close this window...
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
```

And company_name existings already in the profile schema

```typescript
import { pgEnum, pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";

export const membershipEnum = pgEnum("membership", ["free", "starter", "pro"]);

export const profilesTable = pgTable("profiles", {
  id: uuid("id").defaultRandom().notNull(),
  userId: text("user_id").primaryKey().notNull(),
  email: text("email"),
  companyName: text("company_name"),
  membership: membershipEnum("membership").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  firstName: text("first_name"),
  secondName: text("second_name"),
  companyUrl: text("company_url"),
  companyDescription: text("company_description"),
  companyDescriptionCompleted: boolean("company_description_completed").default(false),
  minutesTotalUsed: integer("minutes_total_used").default(0),
  minutesUsedThisMonth: integer("minutes_used_this_month").default(0),
  minutesAvailable: integer("minutes_available").default(0),
  monthlyMinutes: integer("monthly_minutes").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  agentInterviewerName: text("agent_interviewer_name"),
  voiceId: text("voice_id")
});

export type InsertProfile = typeof profilesTable.$inferInsert;
export type SelectProfile = typeof profilesTable.$inferSelect;


// this defines the profiles table in the database
// it defines the columns and the types of the columns
```

# Task 3 - Extract Domain and Update Profile Schema
  - Write logic to extract the company from the domain name
  - We want to get the business name when they enter the URL as part of the url-submit process
  - i.e. if they submit franko.ai ... we would want to update company_name with Franko 
  - Update the company_name field in the profile schema with the formatted value - capital

Let me know if you need any further code?

`app\api\tavily\route.ts` this route and this route `app\api\openai\route.ts` are already being triggered. 

This should be a separate piece of code and should happen at the point when the url-submit process happens.

Here's the component code:

`components\custom-ui\url-submit.tsx`

```typescript
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
import { updateProfileAction, getProfileByUserIdAction } from "@/actions/profiles-actions";

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
  const handleDescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId) {
      try {
        const result = await updateProfileAction(userId, {
          companyDescription: companyDescription
        });

        if (result.status === 'success') {
          setIsDescriptionSaved(true);
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
      if (userId) {
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
        }
      }
    };

    loadProfileData();
  }, [userId]);

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
                <h3 className="text-sm font-semibold">Website</h3>
                <p className="text-sm text-muted-foreground">
                  This will be used for context by the interview agent, so it's important it's correct.
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
                    className="transition-all duration-300 ease-in-out h-8 text-xs px-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-0.5" />
                        Saving...
                      </>
                    ) : isUrlSaved ? (
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
                  {/* Edit button shown only when URL is saved */}
                  {isUrlSaved && (
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={handleUrlEdit}
                      className="transition-all duration-300 ease-in-out h-8 text-xs px-3"
                    >
                      <Edit className="w-3 h-3 mr-0.5" />
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
                  <h3 className="text-sm font-semibold">Company Description</h3>
                  <p className="text-sm text-muted-foreground">
                    This company description will be used for context by the interview agent, please review and edit as needed.
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
                  <div className="space-x-2">
                    <Button 
                      type="submit" 
                      size="sm" 
                      disabled={isDescriptionSaved || companyDescription.trim() === ""}
                      className="transition-all duration-300 ease-in-out h-8 text-xs px-3"
                    >
                      <Save className="w-3 h-3 mr-0.5" />
                      Saved
                    </Button>
                    {isDescriptionSaved && (
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={handleDescriptionEdit}
                        className="transition-all duration-300 ease-in-out h-8 text-xs px-3"
                      >
                        <Edit className="w-3 h-3 mr-0.5" />
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
                We're analyzing your website and generating a company description. This may take a few moments.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center p-4 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Please don't close this window...
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
```

# Task 4

Add Conditional Formatting for Shareable Link Churn Component

On the setup page - `app\setup\page.tsx` - we have the shareable-link-churn component

`components\custom-ui\shareable-link-churn.tsx`

```typescript
"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectProfile } from "@/db/schema"

interface ShareableLinkChurnProps {
  profile: SelectProfile
}

export default function ShareableLinkChurn({ profile }: ShareableLinkChurnProps) {
  const [copied, setCopied] = React.useState(false)
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.franko.ai'
  const shareableUrl = profile?.userId 
    ? `${baseUrl}/start-interview?clientId=${profile.userId}&company=${encodeURIComponent(profile.companyName || '')}`
    : ''

  const handleCopy = async () => {
    if (!shareableUrl) return

    try {
      await navigator.clipboard.writeText(shareableUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  if (!profile) {
    return (
      <Card className="w-full bg-white transition-all duration-300 ease-in-out p-2">
        <CardContent>
          <div>Loading shareable link...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-white transition-all duration-300 ease-in-out p-2">
      <CardHeader className="pb-6">
        <CardTitle className="text-lg font-semibold">Shareable Link</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Customer Churn Use Case</h3>
              <p className="text-sm text-muted-foreground">
                Share this link with your customers who have churned. Upon submitting the form, 
                they'll immediately receive a call from our AI interviewer.
              </p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Input 
                  value={shareableUrl}
                  readOnly
                  className="bg-gray-100/50"
                />
              </div>
              <div className="space-x-2">
                <Button 
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  disabled={!shareableUrl}
                  className="transition-all duration-300 ease-in-out h-8 text-xs px-3"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-0.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-0.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

- I don't want to hide the whole component but just hide the URL from appearing until the fields in url-submit have values. 
- Hide Component Until Required Fields are Completed
- Add logic to conditionally hide the Shareable Link Churn inner text content until the following fields in the URL Submit component have values:
  - Company URL
  - Company Name
  - Company Description

# Task 5

Add Status Indicator (Dot) to Represent Completion
- Add a yellow dot indicator next to each of the heading on the Shareable Link Churn component and url-submit component:
  - i.e. next to 
    - Website
    - Company or Product Name
    - Company Description
    - Customer CHurn Use Case

  - Add a yellow dot (use the warning yellow color - like a warm hue) and change it to a green dot once the field has been saved. 
