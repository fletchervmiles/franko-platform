# Hooking UI together with Database

I have a bunch of UI with placeholder content for now. I also have the backend database set up with Supabase. I want to go through and get it all connected and working.

## Step 1 - Connect the content on the dashboard page with Supabase (DONE)

Here are the relevant pages:

`app\dashboard\page.tsx`
`components\custom-ui\nav.tsx`
`components\custom-ui\interview-dashboard.tsx`

Right now there's mock interview data:

const mockInterviews = [
  { id: 1, intervieweeName: "Fletcher Miles-Thompson", date: "2024-08-07", duration: 45, status: "ready for review", interviewType: "Customer Churn" },
]

Let me map the mock data fields above to my actual fields in my interviews-schema:

id: = user_id (this is the Clerk id that will make to the relevant customer profile)
intervieweeName: = interviewee_first_name, interviewee_last_name (this is actually two values, hopefully you can join these otherwise I can create a separate column in my database joining them)
date: = date_completed (this will need some formatting)
duration: = total_interview_minutes
status: = status
interviewType: = use_case

## Step 2 - Card Creation on Dashboard Page (DONE)

Note, right now there are multiple cards on the dashboard page due to having multiple users with mock data. Let's delete the mock data and use what's in our database. AND it's important that when a new interview is added to the interviews-schema, a new card should be created for that interview. We probably need to trigger an action?

## Step 3 - Clickable Card (DONE)

The card should click through to the `app\interview-page\page.tsx` with the relevant interview details. How am I am to do this? I have a unique ID for the interview itself too... so maybe I need to configure that. Let me know what information would be helpful. 


## Step 4 - Let's update the interview details component

The interview details component - `components\custom-ui\interview-details.tsx`

I will help map them again. The titles remain the same but let's make the values dynamic.

Name, John Doe = interviewee_first_name, interviewee_last_name
Email, john.doe@example.com = interviewee_email
Phone, +1 (555) 123-4567 = interviewee_number
Interview Type, Customer Feedback = use_churn
Date, 15th Jun 23 = date_completed
Duration, 45 minutes = total_interview_minutes (not this is just a number so will need to keep minutes as text)

