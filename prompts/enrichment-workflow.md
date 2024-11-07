# Onboarding Data Enrichment Flow

### High-Level Overview of the Task

Modify the existing url-submit.tsx component to:
- [ ] Accept a user-submitted URL
- [ ] Send the URL to the Talavi API as the first request
- [ ] Use the response from the Talavi API to make a second API request to OpenAI
- [ ] Update the profiles table in the database with the company_url and company_description
- [ ] Display the updated data in the UI within the component

#### Component Setup

Confirm that the `url-submit.tsx` component, located in the `components/custom-ui/` folder already has:
- A text input field for users to submit the URL (e.g., yourURL).
- A submit button or form submission mechanism that triggers a function when clicked.
- If not, add these elements to the component.

#### First API Request 

Import TAVILY_KEY from .env.local

Note, I have already installed 
npm i @tavily/core

Example request below. Note, instead of Wikipedia links the link should be the url from the form. 

```
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your TavilyClient
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Defining the list of URLs to extract content from
const urls = [
    "https://en.wikipedia.org/wiki/Artificial_intelligence",
    "https://en.wikipedia.org/wiki/Machine_learning",
    "https://en.wikipedia.org/wiki/Data_science",
    "https://en.wikipedia.org/wiki/Quantum_computing",
    "https://en.wikipedia.org/wiki/Climate_change"
] // You can provide up to 20 URLs simultaneously

// Step 3. Executing the extract request
response = await tvly.extract(urls)

// Step 4. Printing the extracted raw content
for (let result of response.results) {
    console.log(`URL: ${result['url']}`)
    console.log(`Raw Content: ${result['raw_content']}\n`)
}
// Note that URLs that could not be extracted will be stored in response.failedResults
```

The code should be created in the following page: `app/api/talivy/index.ts`

#### Second API Request 

Take the response from the Talavi API (make sure to specify which data is needed from the response).
Construct a new request to OpenAI using the returned data.
Example structure for the OpenAI request:
Endpoint: https://api.openai.com/v1/engines/[model]/completions
Headers: Include the API key and Content-Type: application/json.
Body: Include the relevant information returned by the Talavi API as part of the prompt or request data.
Ensure this second API request runs only after the first request has been completed successfully.

```
import OpenAI from 'openai';
const client = new OpenAI();

const response = await client.chat.completions.create({
    messages: [{ role: 'user', content: 'Review this text and create a summary of what this company does, it's products and services, etc.' }],
    model: 'gpt-4o'
});

console.log(response._request_id);
```

The code should be created in the following page: `app/api/openai/index.ts`

#### Updating the Database and the Queries And Actions (as required)

Ensure queries for the table are updated

This existing file is named `profiles-queries.ts`.

This file is located in the `db/queries` folder.

Ensure actions for the table are updated

This existing file is named `profiles-actions.ts`.

This file is located in the `/actions` folder.

Updated the queries to ensure new fields are available.

Field Updates:

- The URL from the form should be submitted to company_url
- The output from the Openai response should be submitted to company_description 

Verify that the database functions are properly imported and connected within the component.

#### Rendering the Updated Data

Ensure the url-submit.tsx component fetches and displays the updated company_url and company_description from the database.
If a state management library is used (e.g., React useState or a global state solution like Redux), update the state with the new profile data.
Confirm that the UI rerenders with the new data once the database update completes.


#### Loading Spinner in url-submit.tsx component

Currently a loading spinner modal opens for 3 seconds. It would be ideal if instead of a static number, this time was based on when the openai response was returned.


#### Notes for Context - Logical Flow of the Code
User submits a URL via the input field in url-submit.tsx.
The handleSubmit function triggers:
Send the first API request to Talavi.
Process the response and extract necessary data.
Send the second API request to OpenAI with data from the Talavi response.
Process the OpenAI response and call the update function to update the profiles table.
Update the component state/UI to reflect the changes and show the new company_url and company_description.