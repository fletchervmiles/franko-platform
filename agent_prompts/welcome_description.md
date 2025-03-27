# 🚀 Final Prompt Instructions  

Given the provided inputs, clearly generate a friendly, warm, user-facing introduction for users who start a chatbot conversation.

### You will receive these three inputs:
- **"title"**: (Internal use only) original internal conversation template title.
- **"summary"**: (Internal use only) internal conversation summary (not user-facing).
- **"duration"**: Approximate conversation duration, clearly in one of these exactly:
  - "1 minute (quick)"
  - "2 minutes (recommended)"
  - "3-4 minutes (exploratory)"
  - "4-5 minutes (deep dive)"

---

## 🎯 Clearly Defined Output Requirements

Always output **exactly** the following JSON structure:

```json
{
  "welcome_heading": "string",           // ~6-10 words: conversational, friendly headline phrased as a direct question clearly referencing user's experience and brand/company name
  "welcome_description_card": "string",  // ~15-25 words: clearly, professionally explains the chat (~duration, AI assistant, number of questions clearly mapped below, and expresses genuine appreciation)
  "welcome_description": "string"        // ~6-8 words max: short, conversational phrase summarizing chat topic from user's perspective 
}
```

---

## ✅ Clearly follow these rules for each JSON field:

### 🎈 welcome_heading (~6-10 words)
- Friendly, warm conversational headline.
- Phrase as a short, engaging, direct question clearly referencing the user's experience specifically with the provided brand/company name.
- Use a genuine, human-like, friendly tone clearly.

**Examples of good "welcome_heading":**
- **"Ready to tell us about your EatClub experience?"**
- **"Interested in sharing your thoughts about Franko?"**

---

### 📌 welcome_description_card (~15-25 words)
Include clearly all 4 of these elements in a short paragraph:
- Clearly identifies interaction as chat with **"our AI assistant"** explicitly mentioned.
- Clearly indicates chat duration using duration mapping clearly (e.g. "~1 minute").
- Clearly indicates number of questions using mapping below (e.g. "5 quick questions").
- Clearly communicates genuine appreciation for user feedback in a warm, friendly, concise manner.

**Exact Conversation Duration and Questions Mapping:**

| Conversation Duration             | Clearly Indicate Duration  | Clearly State Number of Questions      |
|---------------------------------- |----------------------------|-----------------------------------------|
| 1 minute (quick)                  | "~1 minute"                | "5 quick questions"                     |
| 2 minutes (recommended)           | "~2 minutes"               | "10 quick questions"                    |
| 3-4 minutes (exploratory)         | "~4 minutes"               | "16 questions"                    |
| 4-5 minutes (deep dive)           | "~6 minutes"               | "approximately 20 questions"            |

**Good example of "welcome_description_card":**
- "This brief ~2 minutes chat with our AI assistant includes 10 quick questions—we greatly appreciate your feedback for helping improve EatClub!"

---

### 🎯 welcome_description (~8 words max)
- Very short friendly phrase clearly summarizing the conversational topic from user's direct perspective.
- Conversational, casual, yet professional.
- Always clearly references the brand/company name.
  
**Examples:**
- "quick chat about your Franko experience"
- "chat about your EatClub favorites"

---

## 🚫 Clearly Avoid:
- Internal jargon, abstract concepts, complicated/technical terms used internally.
- Exceeding clearly defined length limits per field above.
- Any additional clarifications/comments beyond clearly indicated JSON output.

---

## 🚩 Complete Example Clearly Demonstrating Correct Output

**Example Input:**
```json
{
  "title": "Quick Exploration into Churn Causes and Improvement Ideas",
  "summary": "Short chat to identify reasons customers stopped using Franko, their frustrations, and suggestions.",
  "duration": "1 minute (quick)"
}
```

**Correct Output Example:**
```json
{
  "welcome_heading": "Ready to tell us about your experience with Franko?",
  "welcome_description_card": "This brief ~1 minute chat with our AI assistant involves 5 quick questions—your feedback helps us improve and is greatly appreciated!",
  "welcome_description": "quick chat about your Franko experience"
}
```

---

## ✅ Additional Examples Clearly Demonstrating Correct Output:

**Example 1**
**Example Input:**  
```json
{
  "title": "Improving QuickLab’s Online Payment Flow",
  "summary": "Gain insights on user experience, friction points, and improvements in QuickLab’s online payments.",
  "duration": "2 minutes (recommended)"
}
```

**Correct Output Example:**  
```json
{
  "welcome_heading": "Ready to chat about QuickLab’s online payment experience?",
  "welcome_description_card": "This brief ~2 minutes chat with our AI assistant involves 10 quick questions—your feedback helps us greatly improve QuickLab payments!",
  "welcome_description": "quick chat about QuickLab online payment experience"
}
```

---

**Example 2**
**Example Input:**  
```json
{
  "title": "Recommended Check-In: FreshBasket’s Delivery Experience",
  "summary": "Check-in to understand satisfaction/friction with FreshBasket grocery deliveries.",
  "duration": "3-4 minutes (exploratory)"
}
```

**Correct Output Example:**  
```json
{
  "welcome_heading": "How was your FreshBasket grocery delivery experience?",
  "welcome_description_card": "This ~4 minutes chat with our AI assistant involves about 15 questions—your valuable feedback helps us improve FreshBasket deliveries!",
  "welcome_description": "chat about FreshBasket grocery delivery experience"
}
```

**Example 3:**
**Input:**
```json
{
"title": "Quick Insights: Improving PayWise Mobile Checkout",
"summary": "Briefly gather feedback from users on PayEase.com checkout steps to identify checkout improvements.",
"duration": "1 minute (quick)"
}
```
**Correct Output:**
```json
{
"welcome_heading": "Ready to share your PayEase checkout experience?",
"welcome_description_card": "This brief ~1 minute chat with our AI assistant involves 5 quick questions—your feedback helps us improve and is greatly appreciated!",
"welcome_description": "quick chat about your PayEase checkout experience"
}
```
---
**Example 4:**
**Input:**
```json
{
"title": "Focused Feedback on StreamNow’s Video Search Feature",
"summary": "Short conversation to evaluate how easily users find videos on StreamNow and identify search improvements.",
"duration": "2 minutes (recommended)"
}
```
**Correct Output:**
```json
{
"welcome_heading": "Ready to discuss your StreamNow video browsing experience?",
"welcome_description_card": "This brief ~2 minutes chat with our AI assistant involves 10 quick questions—we greatly appreciate your feedback for improving StreamNow!",
"welcome_description": "quick chat on StreamNow video browsing experience"
}
```
---
**Example 5:**
**Input:**
```json
{
"title": "Recommended Check-In: FreshBasket’s Delivery Experience",
"summary": "Check-in to understand user satisfaction or friction with FreshBasket grocery delivery.",
"duration": "3-4 minutes (exploratory)"
}
```
**Correct Output:**
```json
{
"welcome_heading": "How was your FreshBasket grocery delivery experience?",
"welcome_description_card": "This ~4 minutes chat with our AI assistant involves about 15 questions—your valuable feedback helps us improve FreshBasket deliveries!",
"welcome_description": "chat about FreshBasket grocery delivery experience"
}
```
---
**Example 6:**
**Input:**
```json
{
"title": "Improving QuickLab’s Online Payment Flow",
"summary": "Gain understanding of user experience, friction points, and improvements in QuickLab’s online payments.",
"duration": "2 minutes (recommended)"
}
```
**Correct Output:**
```json
{
"welcome_heading": "Ready to chat about QuickLab’s online payment process?",
"welcome_description_card": "This brief ~2 minutes chat with our AI assistant includes 10 quick questions—we greatly appreciate your feedback to help enhance QuickLab payments!",
"welcome_description": "quick chat about QuickLab online payment experience"
}
```
---
**Example 7:**
**Input:**
```json
{
"title": "PetPal App User Experience Check-In",
"summary": "Conversation designed to assess user satisfaction and discover areas of improvement in the PetPal app.",
"duration": "4-5 minutes (deep dive)"
}
```
**Correct Output:**
```json
{
"welcome_heading": "Interested in sharing your PetPal app experience?",
"welcome_description_card": "This ~6 minutes chat with our AI assistant involves approximately 20 questions—your feedback is highly appreciated and helps us enhance PetPal!",
"welcome_description": "chat about your PetPal app experience"
}
```
---
**Example 8:**
**Input:**
```json
{
"title": "Understanding Your FitTrack App Usage",
"summary": "Explore user perceptions, behaviors, and suggestions related to their FitTrack app usage experience.",
"duration": "4-5 minutes (deep dive)"
}
```
**Correct Output:**
```json
{
"welcome_heading": "Ready to tell us about your FitTrack app experience?",
"welcome_description_card": "This ~6 minutes chat with our AI assistant involves approximately 20 questions—your feedback directly helps us enhance FitTrack for everyone!",
"welcome_description": "chat about your FitTrack app experience"
}
```
---
**Example 9:**
**Input:**
```json
{
"title": "Quick Feedback on StreamHub's Video Playback",
"summary": "Short conversation to gather quick reactions to the video playback quality and features on StreamHub.",
"duration": "1 minute (quick)"
}
```
**Correct Output:**
```json
{
"welcome_heading": "Ready to discuss your StreamHub playback experience?",
"welcome_description_card": "This brief ~1 minute chat with our AI assistant involves 5 quick questions—your insights help improve StreamHub and are greatly appreciated!",
"welcome_description": "quick chat on StreamHub video playback experience"
}
```
---

## 📋 Clearly & Consistently Reference Summary:

- ✅ Use the exact structure explicitly provided above.
- ✅ Each clearly provided example demonstrates desired style, tone, and content clearly.
- ✅ Instructions specifically outline length (~words/characters), content, style, format, clearly and consistently.

You can copy this entire prompt exactly as written into your `prompt.md` file.
