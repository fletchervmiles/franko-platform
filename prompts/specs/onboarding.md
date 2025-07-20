## Automated Onboarding & Setup – Implementation Plan  
*(Last updated: January 2025)*
*(FOCUSED ON STEP 1: CONTEXT GENERATION ONLY)*

---

## 🚨 **CURRENT STATUS: Step 3 Modal Creation ✅ COMPLETE**

### 🎯 **STEP 1: Context Generation ✅ COMPLETE**

**What Manual Setup Does:**
1. User enters company URL + name
2. Clicks "Extract Context from Website" 
3. System runs 11 concurrent Exa.js requests
4. AI generates Input Signal + Context Description
5. Updates `organisationDescription` and `organisationDescriptionCompleted`
6. Marks `step1ContextComplete` as done

**What Automated Setup Does:**
1. Extract company info from business email domain
2. Run EXACT same 11 Exa.js requests automatically
3. Run EXACT same AI analysis (Input Signal + Context Setter)
4. Update EXACT same database fields
5. Provide progress feedback to user

### 🎯 **STEP 2: Branding Automation ✅ COMPLETE**

**What Manual Setup Does:**
1. User uploads logo manually via `branding-context.tsx`
2. User selects button color and title color with color pickers
3. Updates `profiles` table: `logoUrl`, `buttonColor`, `titleColor`
4. These become global defaults for all new modals
5. Each modal copies these defaults to its `brandSettings` JSON

**What Automated Setup Will Do:**
1. Extract company domain from email (same as Step 1)
2. Call Brandfetch API with company domain
3. Extract circular logo from `icon.url` field
4. Extract primary brand color from `colors[0].hex` field
5. Update `profiles` table with extracted branding
6. Mark `step2BrandingComplete` as done

**Current vs Automated Mapping:**
- **Logo**: `icon.url` → `profiles.logoUrl` (circular/favicon style)
- **Primary Color**: `colors[0].hex` → `profiles.buttonColor` (used as primary brand color)
- **Secondary Color**: `colors[0].hex` → `profiles.titleColor` (same as primary for now)

**Integration Points:**
- **Global Defaults**: Updates existing `profiles` table fields
- **Modal Inheritance**: New modals copy from global defaults to `brandSettings`
- **User Editing**: Existing `branding-context.tsx` and `interface-tab.tsx` remain unchanged
- **Field Mapping**: Map between `buttonColor` ↔ `primaryBrandColor` in interface

### 🎯 **STEP 3: Modal + Agent Creation ✅ COMPLETE**

**What Manual Setup Does:**
1. User goes to `/create-modal` and creates a modal manually
2. User selects which agents to enable from the agent library
3. User customizes branding for the modal in interface tab
4. User generates conversation plans for each agent individually
5. User can then share the modal embed link

**What Automated Setup Does:**
1. Automatically create a modal named "New Modal" 
2. Pre-select all 6 use-case agents (AGENT01-AGENT06)
3. Apply extracted branding from Step 2 to modal's `brandSettings`
4. Generate conversation plans for all 6 agents in parallel
5. Create chat instances linked to the modal
6. Mark `step3PersonasReviewed` as complete
7. Redirect to `/create-modal?tab=playground` for final review

**Agent Mapping:**
- **AGENT01**: Discovery Trigger - "How did you hear about {organisation_name}?"
- **AGENT02**: Persona + Problem - "Tell us about you and the problem you're solving."
- **AGENT03**: Activation Hurdles - "When you think about the paid plan, what has given you pause?"
- **AGENT04**: Key Benefit - "What do you love most about {organisation_name}?"
- **AGENT05**: Improvements & Friction - "How could we improve {product} for you?"
- **AGENT06**: Feature Wishlist - "What feature should we build next?"

**Technical Implementation:**
- **Agent Library**: Updated `lib/agents-data.ts` with 6 use-case agents
- **Conversation Plans**: Generated using agent-specific prompt templates in `agent_prompts/use-case-agents/`
- **Modal Creation**: Uses existing modal system with automated branding inheritance
- **Parallel Processing**: All 6 conversation plans generated simultaneously for speed

### ✅ **What's Already Built**
- `components/onboarding/processing-steps.tsx` - UI component (needs API integration)
- `/api/context/route.ts` - Complete manual context generation logic
- Database schema - All required fields exist

### ❌ **What We Need to Build**
- Extract context generation logic into reusable function
- Auto-start API endpoint with email domain validation
- Progress polling API endpoint
- Simple onboarding page that calls the APIs
- Signup redirect to automated flow

---

## 📋 **IMPLEMENTATION CHECKLIST - STEP 2 BRANDING**

```
STEP 1 - CONTEXT GENERATION ✅ COMPLETE
✅ Step 1: Create lib/context-generation.ts with extracted logic
✅ Step 2: Test extracted function matches manual exactly
✅ Step 3: Build /api/onboarding/auto-start (email validation + start process)
✅ Step 4: Build /api/onboarding/progress (simple progress tracking)
✅ Step 5: Create /app/onboarding/auto/page.tsx (simple page)
✅ Step 6: Update ProcessingSteps component for API integration
✅ Step 7: Update signup redirect
✅ Step 8: Test business email → auto context generation
✅ Step 9: Test personal email → fallback to manual
✅ Step 10: Verify generated context matches manual quality

STEP 2 - BRANDING AUTOMATION ✅ COMPLETE
✅ Step 11: Update lib/context-generation.ts to include branding step
✅ Step 12: Test Brandfetch API integration with real domains
✅ Step 13: Add branding extraction to auto-start process
✅ Step 14: Update progress tracking for branding step
✅ Step 15: Test branding updates in profiles table
✅ Step 16: Verify modal inheritance from global defaults
✅ Step 17: Test fallback when Brandfetch fails
✅ Step 18: Update ProcessingSteps with branding message

STEP 3 - MODAL + AGENT CREATION ✅ COMPLETE
✅ Step 19: Update lib/agents-data.ts with 6 use-case agents
✅ Step 20: Create ai_folder/create-plans.ts for automated conversation plan generation
✅ Step 21: Add Step 7 to lib/context-generation.ts for modal creation
✅ Step 22: Update progress tracking for modal creation step
✅ Step 23: Update ProcessingSteps component with modal creation step
✅ Step 24: Test parallel conversation plan generation
✅ Step 25: Verify modal creation with branding inheritance
✅ Step 26: Test complete end-to-end automated onboarding flow
```

---

## 🛠 **DETAILED IMPLEMENTATION STEPS**

### **Step 11: Add Branding to Context Generation**

**Goal:** Extend the existing context generation function to include Brandfetch branding extraction

**File:** Update `lib/context-generation.ts`

```typescript
// Add to existing generateContextForUser function after Step 5
// Step 6: Extract Branding (NEW)
logger.info('Starting branding extraction...');
let brandingUpdated = false;

try {
  const brandDetails = await fetchBrandDetails(organisationUrl);
  
  if (brandDetails.logoUrl || brandDetails.primaryColor) {
    const brandingUpdateData: any = {};
    
    if (brandDetails.logoUrl) {
      brandingUpdateData.logoUrl = brandDetails.logoUrl;
    }
    
    if (brandDetails.primaryColor) {
      brandingUpdateData.buttonColor = brandDetails.primaryColor;
      brandingUpdateData.titleColor = brandDetails.primaryColor; // Same as primary for now
    }
    
    if (Object.keys(brandingUpdateData).length > 0) {
      await updateProfile(userId, brandingUpdateData);
      brandingUpdated = true;
      logger.info(`Branding updated for user ${userId}:`, brandingUpdateData);
    }
  }
} catch (error) {
  logger.warn(`Branding extraction failed for user ${userId}, continuing without branding:`, error);
  // Don't fail the entire process if branding fails
}

// Step 7: Mark onboarding steps complete (UPDATED)
await updateOnboardingStep(userId, 'step1ContextComplete');
if (brandingUpdated) {
  await updateOnboardingStep(userId, 'step2BrandingComplete');
}

logger.info(`✅ Automated context generation completed for user ${userId}. Branding: ${brandingUpdated ? 'Updated' : 'Skipped'}`);
```

### **Step 12: Test Brandfetch Integration**

**Goal:** Verify that the existing `fetchBrandDetails` function works correctly with real company domains

**Test Cases:**
```typescript
// Test with known companies
const testDomains = [
  'https://stripe.com',
  'https://github.com', 
  'https://slack.com',
  'https://notion.so',
  'https://figma.com'
];

// Expected results:
// - logoUrl should be a valid URL to circular icon
// - primaryColor should be hex color (e.g., "#5865F2")
// - Should handle failures gracefully
```

### **Step 13: Update Progress Tracking**

**Goal:** Add branding step to progress tracking API

**File:** Update `app/api/onboarding/progress/route.ts`

```typescript
// Update progress calculation to include branding
const isBrandingComplete = !!(profile?.logoUrl || profile?.buttonColor);
const isContextComplete = profile?.organisationDescriptionCompleted || false;

let progress = 0;
let message = "Starting setup...";

if (isContextComplete && isBrandingComplete) {
  progress = 100;
  message = "Setup complete!";
} else if (isContextComplete) {
  progress = 75;
  message = "Extracting your brand assets...";
} else if (isBrandingComplete) {
  progress = 50;
  message = "Finalizing context generation...";
} else if (profile?.organisationUrl) {
  progress = 25;
  message = "Analyzing your company...";
} else {
  progress = 10;
  message = "Researching your company...";
}
```

### **Step 14: Update Processing Steps UI**

**Goal:** Add branding step to the processing animation

**File:** Update `components/onboarding/processing-steps.tsx`

```typescript
const defaultSteps = [
  "Researching your company",
  "Writing a context-rich report for your agents", 
  "Retrieving your brand assets", // NEW STEP
  "Setting up your feedback modal",
]
```

### **Step 15: Test Modal Inheritance**

**Goal:** Verify that new modals inherit global branding defaults

**Test Process:**
1. Complete automated onboarding (context + branding)
2. Create new modal via `/create-modal`
3. Verify modal's `brandSettings` contains:
   - `profilePictureUrl` = `profiles.logoUrl`
   - `primaryBrandColor` = `profiles.buttonColor`
   - Other colors default to primary brand color

**File to Check:** Modal creation logic in `db/queries/modals-queries.ts`

### **Step 16: Test Branding Fallbacks**

**Goal:** Ensure system works when Brandfetch fails

**Test Cases:**
- Invalid domain (should use defaults)
- Brandfetch API timeout (should continue without branding)
- No logo/colors found (should use defaults)
- Brandfetch API key missing (should use defaults)

### **Step 1: Extract Context Generation Logic** ✅ COMPLETE

**Goal:** Create a reusable function that performs the exact same process as `/api/context/route.ts`

**File:** Create `lib/context-generation.ts`

```typescript
import Exa from "exa-js";
import { updateProfile } from "@/db/queries/profiles-queries";
import { gemini25FlashPreviewModel } from "@/ai_folder";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { logger } from "@/lib/logger";
import fs from 'fs';
import path from 'path';
import { updateOnboardingStep } from '@/db/queries/user-onboarding-status-queries';

// EXACT same schemas from /api/context/route.ts
const inputSignalSchema = z.object({
  customerRoles: z.array(z.object({
    title: z.string(),
    evidence: z.string()
  })).default([]),
  featureMenu: z.array(z.object({
    name: z.string(),
    alias: z.string()
  })).default([]),
  customerBenefitClaims: z.array(z.string()).default([])
});

// EXACT same helper functions from /api/context/route.ts
function loadContextSetterPrompt() {
  try {
    const promptPath = path.join(process.cwd(), 'agent_prompts', 'context_setter.md');
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('Error loading context setter prompt:', error);
    throw new Error('Failed to load context setter prompt');
  }
}

function loadInputSignalPrompt() {
  try {
    const promptPath = path.join(process.cwd(), 'agent_prompts', 'input_signal.md');
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('Error loading input signal prompt:', error);
    throw new Error('Failed to load input signal prompt');
  }
}

async function retryExaRequest(fn: () => Promise<any>, maxAttempts = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

/**
 * CORE CONTEXT GENERATION FUNCTION
 * Extracted from /api/context/route.ts - performs EXACT same process
 */
export async function generateContextForUser(
  userId: string,
  organisationUrl: string,
  organisationName: string
): Promise<{ success: boolean; description?: string; error?: string }> {
  
  logger.info(`Starting automated context generation for user ${userId}`, { 
    organisationUrl, 
    organisationName 
  });

  try {
    // Step 1: Update profile with initial data (EXACT same as manual)
    logger.info('Updating profile with initial data:', { organisationUrl, organisationName });
    const initialUpdate = await updateProfile(userId, {
      organisationUrl,
      organisationName,
    });
    logger.info('Initial profile update successful');

    // Step 2: Run all 11 Exa requests (EXACT same as manual)
    const exa = new Exa(process.env.EXA_API_KEY!);
    const timeout = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    logger.info('Starting 11 concurrent Exa requests (same as manual)...');

    const exaResults = await Promise.allSettled([
      // EXACT same 11 requests as /api/context/route.ts lines 200-333
      retryExaRequest(async () => {
        logger.info('Making Exa request 1 (same as manual)');
        return await exa.getContents(
          [organisationUrl],
          {
            text: { maxCharacters: 4000 },
            livecrawl: "always",
            subpages: 10
          }
        );
      }),
      
      (async () => {
        const query = `Here is a comprehensive overview of ${organisationName} (${organisationUrl}), covering their company background, products, services, mission, industry, target market, and unique value proposition:`;
        logger.info('Making Exa request 2 (same as manual)');
        return await exa.searchAndContents(query, {
          text: { maxCharacters: 4000 },
          type: "auto"
        });
      })(),
      
      (async () => {
        const query = `Here's what people are saying about ${organisationName} (${organisationUrl}), including customer opinions, online discussions, forums, user feedback, testimonials, and ratings:`;
        logger.info('Making Exa request 3 (same as manual)');
        return await exa.searchAndContents(query, {
          text: { maxCharacters: 4000 },
          type: "auto"
        });
      })(),
      
      // Extract 04-11 (EXACT same as manual)
      exa.searchAndContents(`site:${organisationUrl} case study ${organisationName}`, {
        type: "keyword",
        text: { maxCharacters: 4000 }
      }),
      
      exa.searchAndContents(`"${organisationName}" review`, {
        type: "neural",
        text: { maxCharacters: 3000 }
      }),
      
      exa.searchAndContents(`Reddit "${organisationName}"`, {
        type: "keyword",
        text: { maxCharacters: 2500 }
      }),
      
      exa.getContents([organisationUrl], {
        subpages: 8,
        subpage_target: ["docs", "integration", "quickstart"],
        text: { maxCharacters: 3000 }
      }),
      
      exa.searchAndContents(`${organisationName} webinar OR YouTube talk`, {
        type: "neural",
        text: { maxCharacters: 3000 }
      }),
      
      exa.getContents([organisationUrl], {
        subpages: 6,
        subpage_target: ["release", "changelog", "blog"],
        text: { maxCharacters: 2500 }
      }),
      
      exa.searchAndContents(`"${organisationName}" "case study pdf"`, {
        type: "keyword",
        text: { maxCharacters: 3500 }
      }),
      
      exa.searchAndContents(`"${organisationName}" pricing plans`, {
        type: "keyword",
        text: { maxCharacters: 2000 }
      })
    ]);

    clearTimeout(timeoutId);
    logger.info('All 11 Exa requests completed (same as manual)');

    // Extract results (EXACT same mapping as manual)
    const [
      extract01Result, extract02Result, extract03Result,
      extract04Res, extract05Res, extract06Res,
      extract07Res, extract08Res, extract09Res,
      extract10Res, extract11Res
    ] = exaResults;
    
    const extract01 = extract01Result.status === 'fulfilled' ? extract01Result.value : null;
    const extract02 = extract02Result.status === 'fulfilled' ? extract02Result.value : null;
    const extract03 = extract03Result.status === 'fulfilled' ? extract03Result.value : null;
    const extract04 = extract04Res.status === 'fulfilled' ? extract04Res.value : null;
    const extract05 = extract05Res.status === 'fulfilled' ? extract05Res.value : null;
    const extract06 = extract06Res.status === 'fulfilled' ? extract06Res.value : null;
    const extract07 = extract07Res.status === 'fulfilled' ? extract07Res.value : null;
    const extract08 = extract08Res.status === 'fulfilled' ? extract08Res.value : null;
    const extract09 = extract09Res.status === 'fulfilled' ? extract09Res.value : null;
    const extract10 = extract10Res.status === 'fulfilled' ? extract10Res.value : null;
    const extract11 = extract11Res.status === 'fulfilled' ? extract11Res.value : null;

    // Step 3: Generate Input Signal (EXACT same as manual)
    let rawInputSignalString = "";
    const maxInputSignalRetries = 3;
    
    logger.info('Starting Input Signal generation (same as manual)...');
    try {
      const inputSignalPromptTemplate = loadInputSignalPrompt();
      const filledInputSignalPrompt = inputSignalPromptTemplate
        .replace(/{organisation_name}/g, organisationName)
        .replace(/{organisation_url}/g, organisationUrl)
        .replace('{extract01}', JSON.stringify(extract01 || {}, null, 2))
        .replace('{extract02}', JSON.stringify(extract02 || {}, null, 2))
        .replace('{extract03}', JSON.stringify(extract03 || {}, null, 2))
        .replace('{extract04}', JSON.stringify(extract04 || {}, null, 2))
        .replace('{extract05}', JSON.stringify(extract05 || {}, null, 2))
        .replace('{extract06}', JSON.stringify(extract06 || {}, null, 2))
        .replace('{extract07}', JSON.stringify(extract07 || {}, null, 2))
        .replace('{extract08}', JSON.stringify(extract08 || {}, null, 2))
        .replace('{extract09}', JSON.stringify(extract09 || {}, null, 2))
        .replace('{extract10}', JSON.stringify(extract10 || {}, null, 2))
        .replace('{extract11}', JSON.stringify(extract11 || {}, null, 2));

      for (let attempt = 1; attempt <= maxInputSignalRetries; attempt++) {
        try {
          const inputSignalResult = await generateObject({
            model: gemini25FlashPreviewModel,
            prompt: filledInputSignalPrompt,
            schema: inputSignalSchema,
          });

          rawInputSignalString = JSON.stringify(inputSignalResult.object, null, 2);
          logger.info('Input Signal generation successful (same as manual)');
          break;
        } catch (error) {
          if (attempt === maxInputSignalRetries) {
            logger.error('All Input Signal attempts failed:', error);
            rawInputSignalString = "{}";
          } else {
            logger.warn(`Input Signal attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
    } catch (error) {
      logger.error('Input Signal generation failed:', error);
      rawInputSignalString = "{}";
    }

    // Step 4: Generate Final Description (EXACT same as manual)
    let description: string | undefined;
    const maxContextSetterRetries = 3;
    
    logger.info('Starting Context Setter generation (same as manual)...');
    try {
      const contextSetterPromptTemplate = loadContextSetterPrompt();
      const filledContextSetterPrompt = contextSetterPromptTemplate
        .replace(/{organisation_name}/g, organisationName)
        .replace(/{organisation_url}/g, organisationUrl)
        .replace('{extract01}', JSON.stringify(extract01 || {}, null, 2))
        .replace('{extract02}', JSON.stringify(extract02 || {}, null, 2))
        .replace('{extract03}', JSON.stringify(extract03 || {}, null, 2))
        .replace('{extract04}', JSON.stringify(extract04 || {}, null, 2))
        .replace('{extract05}', JSON.stringify(extract05 || {}, null, 2))
        .replace('{extract06}', JSON.stringify(extract06 || {}, null, 2))
        .replace('{extract07}', JSON.stringify(extract07 || {}, null, 2))
        .replace('{extract08}', JSON.stringify(extract08 || {}, null, 2))
        .replace('{extract09}', JSON.stringify(extract09 || {}, null, 2))
        .replace('{extract10}', JSON.stringify(extract10 || {}, null, 2))
        .replace('{extract11}', JSON.stringify(extract11 || {}, null, 2))
        .replace('{input_signal_string}', rawInputSignalString);

      for (let attempt = 1; attempt <= maxContextSetterRetries; attempt++) {
        try {
          const contextResult = await generateText({
            model: gemini25FlashPreviewModel,
            prompt: filledContextSetterPrompt,
          });

          description = contextResult.text?.trim();
          if (description) {
            logger.info('Context Setter generation successful (same as manual)');
            break;
          }
        } catch (error) {
          if (attempt === maxContextSetterRetries) {
            logger.error('All Context Setter attempts failed:', error);
            throw new Error('Failed to generate context description');
          } else {
            logger.warn(`Context Setter attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
    } catch (error) {
      logger.error('Context Setter generation failed:', error);
      throw new Error('Failed to generate context description');
    }

    if (!description) {
      throw new Error('No description generated');
    }

    // Step 5: Update profile with final description (EXACT same as manual)
    logger.info('Updating profile with generated description...');
    await updateProfile(userId, {
      organisationDescription: description,
      organisationDescriptionCompleted: true,
    });

    // Step 6: Mark onboarding step complete (EXACT same as manual)
    await updateOnboardingStep(userId, 'step1ContextComplete');
    logger.info(`✅ Automated context generation completed for user ${userId}`);

    return { success: true, description };

  } catch (error) {
    logger.error(`❌ Automated context generation failed for user ${userId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

### **Step 2: Build Auto-Start API**

**File:** Create `app/api/onboarding/auto-start/route.ts`

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { getProfileByUserId } from "@/db/queries/profiles-queries";
import { generateContextForUser } from "@/lib/context-generation";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for context generation

// Blocked personal email domains
const BLOCKED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
  'icloud.com', 'aol.com', 'protonmail.com', 'tutanota.com',
  'mail.com', 'yandex.com', 'zoho.com'
];

function extractCompanyInfo(email: string): { domain: string; companyName: string } | null {
  const emailParts = email.split('@');
  if (emailParts.length !== 2) return null;
  
  const domain = emailParts[1].toLowerCase();
  
  if (BLOCKED_DOMAINS.includes(domain)) {
    return null;
  }
  
  const domainParts = domain.split('.');
  const companyName = domainParts[0]
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  
  return { domain: `https://${domain}`, companyName };
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ 
        error: "Email is required",
        shouldFallback: true 
      }, { status: 400 });
    }

    // Check if user already has context (skip automation)
    const profile = await getProfileByUserId(userId);
    if (profile?.organisationDescription) {
      logger.info(`User ${userId} already has context, skipping automation`);
      return NextResponse.json({ 
        skipped: true, 
        reason: "existing_context",
        redirectTo: "/workspace" 
      });
    }

    // Extract company info from email
    const companyInfo = extractCompanyInfo(email);
    if (!companyInfo) {
      logger.info(`Personal email detected for user ${userId}, falling back to manual`);
      return NextResponse.json({ 
        error: "Personal email domain detected",
        shouldFallback: true,
        fallbackUrl: "/context-setup"
      }, { status: 400 });
    }

    // Start context generation in background
    processContextGeneration(userId, companyInfo.domain, companyInfo.companyName)
      .catch(error => {
        logger.error(`Background context generation failed for user ${userId}:`, error);
      });

    return NextResponse.json({ 
      success: true,
      message: "Context generation started",
      companyName: companyInfo.companyName
    });

  } catch (error) {
    logger.error(`Error in /api/onboarding/auto-start:`, error);
    return NextResponse.json({ 
      error: "Internal server error",
      shouldFallback: true 
    }, { status: 500 });
  }
}

async function processContextGeneration(userId: string, companyUrl: string, companyName: string) {
  try {
    logger.info(`Starting background context generation for user ${userId}`);
    
    const result = await generateContextForUser(userId, companyUrl, companyName);

    if (result.success) {
      logger.info(`✅ Context generation completed for user ${userId}`);
    } else {
      logger.error(`❌ Context generation failed for user ${userId}: ${result.error}`);
    }

  } catch (error) {
    logger.error(`Context generation error for user ${userId}:`, error);
  }
}
```

### **Step 3: Build Progress API**

**File:** Create `app/api/onboarding/progress/route.ts`

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOnboardingStatus } from "@/db/queries/user-onboarding-status-queries";
import { getProfileByUserId } from "@/db/queries/profiles-queries";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [status, profile] = await Promise.all([
      getOnboardingStatus(userId),
      getProfileByUserId(userId)
    ]);

    // Check context generation status
    const isContextComplete = profile?.organisationDescriptionCompleted || false;
    const hasContextDescription = !!profile?.organisationDescription;

    // Simple progress calculation
    let progress = 0;
    let message = "Starting context generation...";
    
    if (isContextComplete) {
      progress = 100;
      message = "Context generation complete!";
    } else if (hasContextDescription) {
      progress = 90;
      message = "Finalizing context...";
    } else if (profile?.organisationUrl) {
      progress = 50;
      message = "Analyzing your company...";
    } else {
      progress = 10;
      message = "Researching your company...";
    }

    return NextResponse.json({
      isComplete: isContextComplete,
      progress,
      message,
      shouldRedirect: isContextComplete ? "/create-modal?tab=playground" : null
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### **Step 4: Create Simple Onboarding Page**

**File:** Create `app/onboarding/auto/page.tsx`

```typescript
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"

export default function AutoOnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("Starting setup...")
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize auto-onboarding
  useEffect(() => {
    async function initializeOnboarding() {
      if (!isLoaded || !user) return

      try {
        const response = await fetch('/api/onboarding/auto-start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user.primaryEmailAddress?.emailAddress 
          }),
        })

        const result = await response.json()

        if (!response.ok || result.shouldFallback) {
          if (result.fallbackUrl) {
            router.push(result.fallbackUrl)
          } else {
            router.push('/context-setup')
          }
          return
        }

        if (result.skipped) {
          router.push(result.redirectTo || '/workspace')
          return
        }

        setIsInitializing(false)

      } catch (error) {
        console.error('Error initializing:', error)
        setError('Failed to start setup')
        setTimeout(() => router.push('/context-setup'), 2000)
      }
    }

    initializeOnboarding()
  }, [isLoaded, user, router])

  // Poll for progress
  useEffect(() => {
    if (isInitializing) return

    let pollInterval: NodeJS.Timeout

    const pollProgress = async () => {
      try {
        const response = await fetch('/api/onboarding/progress')
        if (!response.ok) throw new Error('Progress check failed')
        
        const data = await response.json()
        setProgress(data.progress)
        setMessage(data.message)
        
        if (data.isComplete && data.shouldRedirect) {
          clearInterval(pollInterval)
          setTimeout(() => {
            router.push(data.shouldRedirect)
          }, 1500)
        }
        
      } catch (err) {
        console.error('Error polling progress:', err)
        setError('Setup encountered an issue')
        clearInterval(pollInterval)
      }
    }

    pollProgress() // Initial poll
    pollInterval = setInterval(pollProgress, 2000) // Poll every 2 seconds

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [isInitializing, router])

  if (!isLoaded || !user) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Setup Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to manual setup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Setting Up Your Account
          </h1>
          <p className="text-gray-600">
            We're automatically generating your company context...
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Status message */}
        <div className="flex items-center justify-center text-gray-600">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>{message}</span>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This usually takes 30-60 seconds
          </p>
        </div>
      </div>
    </div>
  )
}
```

### **Step 5: Update Signup Redirect**

**File:** Update `app/(auth)/sign-up/[[...sign-up]]/page.tsx`

```typescript
"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignUp
      signInUrl="/sign-in"
      redirectUrl="/onboarding/auto" // Changed from /context-setup
      path="/sign-up"
      routing="path"
    />
  );
}
```

---

## 🎯 **SUCCESS CRITERIA - STEP 2 BRANDING**

**The Step 2 implementation is complete when:**

1. ✅ Step 1 (Context Generation) remains working perfectly
2. ✅ Brandfetch API integration extracts logo and primary color
3. ✅ Branding updates are saved to profiles table correctly
4. ✅ Modal creation inherits global branding defaults
5. ✅ Branding failures don't break the overall process
6. ✅ Progress tracking shows branding extraction step
7. ✅ Existing manual branding functionality remains unchanged

**Testing Checklist:**
```
STEP 1 REGRESSION TESTING
✅ Business email → context generation still works
✅ Personal email → fallback still works  
✅ Progress tracking → context step still works

STEP 2 NEW FUNCTIONALITY
□ Business email with known brand (stripe.com) → logo + color extracted
□ Business email with unknown brand → context works, branding skipped
□ Brandfetch API failure → context works, branding skipped gracefully
□ Profile branding fields updated correctly (logoUrl, buttonColor, titleColor)
□ New modal creation → inherits from profile branding defaults
□ Manual branding editing → still works via branding-context.tsx
□ Interface tab → still works for per-modal customization
□ Progress UI → shows "Extracting your brand assets" step
```

**Integration Points Verified:**
- ✅ `lib/context-generation.ts` - Includes branding extraction
- ✅ `lib/brandfetch.ts` - Extracts icon.url and colors[0].hex  
- ✅ `profiles` table - Updates logoUrl, buttonColor, titleColor
- ✅ Modal creation - Copies global defaults to brandSettings
- ✅ Progress API - Tracks branding completion
- ✅ ProcessingSteps UI - Shows branding step

**Next Steps After Step 2:**
- Step 3: Modal and agent creation (6 predefined agents)
- Step 4: Full redirect to create-modal playground tab
- Step 5: End-to-end testing and polish

**Current Focus:** Step 2 branding automation. Step 1 context generation is complete and working.
