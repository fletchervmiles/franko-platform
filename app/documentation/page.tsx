'use client'

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown (tables, etc.)
import Nav from '@/components/lp-components/nav'; // Import the Nav component

// Remove the main heading from the markdown string
const markdownContent = `This document explains how to configure and utilize webhooks from the Franko platform to receive notifications and data when a conversation is completed.

### Introduction    

Webhooks provide a way for the Franko platform to send real-time data to your external applications or services automatically. When a specific event occurs within Franko, we send an HTTP POST request containing relevant data to the endpoint URL you configure.

Currently, the primary supported event is:
- conversation.completed: Triggered when a Franko conversation reaches its conclusion. 

### Prerequisites

Before configuring a webhook, you need an endpoint URL from your receiving application that:

1. Is publicly accessible over the internet.
2. Uses HTTPS for secure communication.
3. Is capable of receiving HTTP POST requests with a JSON payload.

### Configuration Steps

You can manage webhooks within the Franko platform:
1. From the Workplace dashboard, click to the Conversation you want to configure.
2. Select the Integrations tab.
3. You'll see the Webhooks card.
4. Click "Add Webhook".
5. Fill in the details:
    - Endpoint URL: (Required) Paste the HTTPS URL provided by your receiving application (e.g., the URL from a Make/Zapier webhook trigger, or your custom API endpoint).
    - Description: (Optional) A short description for your reference (e.g., "Send summary to Slack").
    - Add a signing secret: (Optional) Check this box to generate a unique secret key for this webhook. See the Security: Signature Verification section for details. Important: The secret key will be shown only once immediately after creation. Copy it and store it securely in your receiving application.

6. Click "Create Webhook".
Once created, you can:
- Activate/Deactivate: Use the toggle switch to enable or disable the webhook without deleting it.
- Edit: Modify the URL or description. Note: You cannot view the secret again after creation; use "Regenerate Secret" if needed.
- Regenerate Secret: Generate a new signing secret. See Handling Secret Regeneration.
- Delete: Permanently remove the webhook configuration.

### Payload Structure
The JSON payload will have the following fields:

- Event (string): The type of event that occurred. Always conversation.completed.
- ChatResponseId (string): The unique identifier (UUID) for this specific chat response record.
- ChatInstanceId (string): The unique identifier (UUID) for the parent chat instance (conversation configuration).
- UserId (string): Your unique identifier for your Franko account.
- Status (string): The final status of the chat response. Usually "completed".
- InterviewStartTime (string): The timestamp (ISO 8601 format) when the interview started.InterviewEndTime 
- (string): The timestamp (ISO 8601 format) when the interview ended, if recorded.
- TotalInterviewMinutes (number): The calculated duration of the interview in whole minutes.
- CompletionStatus (string): An estimated percentage of the conversation plan objectives that were covered (e.g., "100%").
- UserWords (string): A count of words spoken written by the interviewee.
- TranscriptSummary (string): An AI-generated summary of the conversation transcript (Markdown format).
- CleanTranscript (string): The cleaned conversation transcript, formatted for readability (newlines represented as \\\\n).
- IntervieweeFirstName (string | null): The first name provided by the interviewee during the chat, if any.
- IntervieweeSecondName (string | null): The second name provided by the interviewee during the chat, if any.
- IntervieweeEmail (string | null): The email address provided by the interviewee during the chat, if any.
- CreatedAt (string): The timestamp (ISO 8601 format) when the chat response record was initially created.
- UpdatedAt (string): The timestamp (ISO 8601 format) when the chat response record was last updated (finalized).

#### Example Payload

\`\`\`JSON
{
  "event": "conversation.completed",
  "chatResponseId": "f648270f-37f4-4076-b767-5a9992b5d555",
  "chatInstanceId": "9dcbb7d8-7084-4780-bda2-ed8881b30555",
  "userId": "user_2vRIz4G277KVqY4D60w3BTJy555",
  "status": "completed",
  "interviewStartTime": "2025-04-09T01:44:16.065Z",
  "interviewEndTime": "2025-04-09T01:46:30.471Z",
  "totalInterviewMinutes": 2,
  "completionStatus": "100%",
  "userWords": "53",
  "transcriptSummary": "Summary will appear here",
  "cleanTranscript": "Conversation Transcript will appear here",
  "intervieweeFirstName": "John",
  "intervieweeSecondName": null,
  "intervieweeEmail": "john@example.com",
  "createdAt": "2025-04-09T01:44:15.005Z",
  "updatedAt": "2025-04-09T01:46:36.268Z"
}
\`\`\`

### Security: Signature Verification (Optional)

To ensure that incoming webhook requests genuinely originate from the Franko platform and haven't been tampered with, we strongly recommend using the signing secret.

**How it Works:**
1. When you enable the signing secret for a webhook, Franko generates a unique, cryptographically secure key.
2. Before sending a webhook request, Franko calculates a HMAC-SHA256 signature. This signature is created using your unique secret key and the raw JSON payload of the request.
3. Franko sends this signature in the X-Webhook-Signature HTTP header with the request.
4. Your receiving application must perform the same HMAC-SHA256 calculation using the raw request body it receives and the same secret key (which you stored securely during configuration).
5. Compare the signature your application calculated with the signature received in the X-Webhook-Signature header. If they match exactly, the request is authentic and can be trusted.

**Verification Steps in Your Application:**
1. **Receive the request:** Get the incoming POST request.
2. **Extract the signature:** Read the value of the X-Webhook-Signature header. If this header is missing and you expect signatures, reject the request.
3. **Get the raw body:** Read the entire raw request body as a string or byte buffer. Crucially, do not use a pre-parsed JSON object for verification, as subtle differences in whitespace or key order during parsing can invalidate the signature.
4. **Retrieve your stored secret:** Get the specific webhook secret key associated with this endpoint (you might have multiple webhooks configured).
5. **Compute expected signature:** Calculate the HMAC-SHA256 hash of the raw request body using your stored secret key.
6. **Encode the result:** Ensure your computed hash is encoded as a hexadecimal string.
7. **Compare signatures:** Compare the signature extracted from the header (Step 2) with the signature you computed (Step 6). Use a constant-time comparison function if possible to mitigate timing attacks (though simple string equality is often sufficient for many use cases).
8. **Process or Reject:**
    - If the signatures match, process the payload (parse the JSON, perform actions).
    - If the signatures do not match, reject the request. Do not process it. Respond with an appropriate error status (e.g., 401 Unauthorized or 403 Forbidden).


### Troubleshooting

- Webhook Not Received:
  - Verify the Endpoint URL is correct (HTTPS, no typos).
  - Ensure the webhook is marked as "Active" in the Franko UI.
  - Check if your endpoint is publicly accessible and not blocked by firewalls.
  - Check Franko's server logs (if accessible) or contact support to see if the webhook trigger failed on Franko's end.

- Signature Verification Failure (401/403 Response):
  - Double-check that the secret stored in your application exactly matches the one configured in Franko for that webhook URL.
  - Ensure your code is using the raw request body, not a parsed JSON object, for the HMAC calculation.
  - Confirm you are using the correct algorithm (HMAC-SHA256) and encoding the result as hexadecimal.
  - Verify you are extracting the signature from the correct header (X-Webhook-Signature).

- Payload Parsing Errors:
  - Ensure your application correctly expects and parses application/json content.
  - Check for any unexpected characters or formatting issues in the raw payload (though this is unlikely if originating from Franko).
`;

export default function DocumentationPage() {
  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 mt-12 mb-12 border border-gray-200 rounded-md">
        {/* Render the main heading separately and centered */}
        <h1 className="text-3xl font-bold text-center mb-8">
          Setting up a webhook
        </h1>

        {/* Apply prose styles for the rest of the markdown content */}
        <article className="prose prose-indigo">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownContent}
          </ReactMarkdown>
        </article>
      </main>
    </div>
  );
}
