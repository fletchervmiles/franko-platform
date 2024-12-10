# Instructions for Implementing a Demo Account System

## Overview

Objective: Create a demo account feature that functions exactly like existing authenticated accounts but without requiring authentication. This allows users to explore the app's functionalities without signing up.
The demo account will:

- Use the same database tables (profiles, interviews) as regular accounts.
- Have the same schema and relationships.
- Be able to be updated and have its own data.
- Use a predefined userId which is "user_demo_account"

## Key Principles

1. Same Data Structure: The demo profile and its data should exist in the same tables and follow the same schema as real user profiles.

2. Same Functionality: All features available to authenticated users should be accessible in the demo account. The only difference is the authentication process is bypassed and the predefined userId is used.

3. Component Refactoring: As part of this, components should be refactored to accept userId as a prop instead of relying on authentication hooks or contexts. This centralizes user handling in the routes/pages. The routes will also need to be updated, of course.

## Implementation Plan

**Phase 1: Set Up the Demo Profile**

The new profile has been created with the userid of "user_demo_account"

This profile will be used throughout the demo routes.


**Phase 2: Refactor Components**

Modify Components to Accept userId as a Prop

Action: Identify all components that rely on authentication hooks (e.g., useUser, useAuth).
Details:
  - Refactor these components to accept userId (and any other necessary user data) as props.
  - Remove direct dependencies on authentication hooks within the components.
  - This makes components more reusable and easier to test.

Example code -

```typescript
  interface InterviewDashboardProps {
    userId: string;
  }

  export default function InterviewDashboard({ userId }: InterviewDashboardProps) {
    // Use userId for data fetching and other logic
  }
```

Here are the list of components:

`components\custom-ui\audio-player.tsx` - DONE
`components\custom-ui\contact-card.tsx` - DONE
`components\custom-ui\faqs.tsx` - DONE
`components\custom-ui\form-footer.tsx`- DONE
`components\custom-ui\form-popup-modal.tsx`- DONE
`components\custom-ui\interview-card.tsx`- DONE
`components\custom-ui\interview-container.tsx` - DONE
`components\custom-ui\interview-dashboard.tsx`- DONE
`components\custom-ui\interview-details.tsx`- DONE

`components\custom-ui\interview-form.tsx` - DONE

`components\custom-ui\nav.tsx` - DONE
`components\custom-ui\demoNav.tsx` - DONE

`components\custom-ui\plan-usage.tsx` - DONE

`components\custom-ui\shareable-link-churn.tsx` - DONE
`components\custom-ui\status-change.tsx`- DONE
`components\custom-ui\subscription.tsx` - DONE
`components\custom-ui\summary.tsx` - DONE
`components\custom-ui\transcript.tsx`- DONE
`components\custom-ui\url-submit.tsx` - DONE
`components\custom-ui\voice-selector.tsx`- DONE

Review them three at a time only.


**Phase 3 - Update Authenticated Routes to Pass userId**

- Action: In authenticated routes (e.g., app/dashboard/page.tsx), fetch userId using authentication and pass it as a prop.
- Details:
  - Use your authentication library (e.g., Clerk's auth() function) to get the userId.
  - Pass the userId down to components that require it.

  - Example:

```typescript
  import { auth } from "@clerk/nextjs/server";

  export default async function DashboardPage() {
    const { userId } = await auth();
    // Handle unauthenticated state if necessary

    return <InterviewDashboard userId={userId} />;
  }
```

Check the following routes:

`app\account\page.tsx` - DONE
`app\dashboard\page.tsx` - DONE
`app\interview\[id]\page.tsx` - DONE
`app\logout\page.tsx` - DONE
`app\setup\page.tsx` - DONE
`app\start-interview\page.tsx` - DONE
`app\support\page.tsx` - DONE

Check two at a time, maximum.


**Phase 4: Update Demo Routes to Pass hard-coded userid**

Here are the duplicated demo routes and code:

`app\demo\account\page.tsx` - DONE
`app\demo\dashboard\page.tsx` - DONE
`app\demo\interview\[id]\page.tsx` - DONE
`app\demo\logout\page.tsx` - DONE
`app\demo\setup\page.tsx` - DONE
`app\demo\start-interview\page.tsx`
`app\demo\support\page.tsx`

Remove any authentication requirements from these routes.
These routes should import and use the same components as the authenticated routes.
These routes should be hard-coded to pass in user_demo_account.
Review these routes 2 at a time. This will stop you getting overwhelmed with too much code.


**Phase 5: Adjust Navigation and Layout**

- Copied the existing navigation component and created a new one

`components\custom-ui\nav.tsx`
`components\custom-ui\demoNav.tsx`

Update navigation links to point to demo routes (e.g., /demo/dashboard).

Action: In your demo pages, import and use the demo navigation component.
Details:
Ensure that all links within the navigation point to the correct demo routes.


**Phase 6: Ensure API routes can handle demo userId**

All API routes should function with the demo account. 

Here are the main routes for review:

`app\api\clients\[clientId]\route.ts`
`app\api\openai\route.ts`
`app\api\proxy\call\route.ts`
`app\api\tavily\route.ts`


**Phase 7: Review Middleware Behaviour**

Action: Ensure that your middleware does not block demo routes.
Details:
Update middleware configurations to exclude demo routes from authentication checks (if required)

`middleware.ts`



**Tips**
Work Incrementally: Tackle one route and its components at a time to avoid being overwhelmed.
Testing: After each significant change, test both the demo and authenticated versions to ensure everything works as expected.
Ask Questions: If anything is unclear, don't hesitate to ask for clarification.
Keep Security in Mind: Always consider the security implications of allowing unauthenticated access, even in demo mode.

Conclusion
By following these steps, you'll create a demo account system that allows users to explore the application's features without authentication while maintaining data integrity and security. Refactoring components to accept user data as props enhances code reusability and simplifies the management of user states across different contexts.