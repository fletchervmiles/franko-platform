# Tasks

## Objective

Reorganize components within the application by moving existing components to a new page, creating a new component, and updating the navigation menu accordingly.

### Step 1 - Update Components

Remove Components from Account Page:

Locate the Account Page file - `app/account/page.tsx`

Remove the following components from the Account Page
- URL Submission Form
- Voice Selection Card

Add Components to Setup Page:

Locate the Setup Page - `app/setup/page.tsx`

Import and add the removed components to the Setup Page:

- URL Submission Form
- Voice Selection Card

### Step 2 - Update the Navigation Menu

Add Setup Link:

Locate the Navigation Component file - `components/custom-ui/nav.tsx`

Add a new navigation link labeled "Setup".
Use an appropriate icon to match the style of existing navigation items.
Ensure the link routes to the Setup Page.

Reorder Navigation Items:

Update the order of the navigation links to the following sequence:
Dashboard
Setup
Account
Sign Out

### Step 3 - Create and Add the Shareable-Link-Churn Component

Create the Component:

In the components directory, update the following file:

`C:\Users\fletc\Desktop\franko-platform\components\custom-ui\shareable-link-churn.tsx`

Structure the component to match the styling of the URL Submission Form component.

`C:\Users\fletc\Desktop\franko-platform\components\custom-ui\url-submit.tsx`

Component Structure:

Heading: Add a heading titled "Your Shareable Link".

Subheading: Include a subheading with the text "Customer Churn Use Case".

Description Text: Add gray-colored text saying 
"Share this with your customers who have churned. Upon submitting the form, they'll immediately recieve a call from our AI interviewer."

URL Display Box:
Create a box or input field displaying the placeholder URL www.placeholder.com.

Ensure the URL is not editable by the user.
Copy Button:
Add a button labeled "Copy" next to or below the URL box. Add a "Copied" interaction when the button is pressed.

Implement functionality to copy the URL www.placeholder.com to the clipboard when clicked.

Import Component into Setup Page:

Import the Shareable-Link-Churn component into the Setup Page.

Add it to the page below the URL Submission Form and above the Voice Selection Card, or arrange as per design specifications.

Finalize Setup Page Components:

The Setup Page should now include:
URL Submission Form
Shareable-Link-Churn
Voice Selection Card