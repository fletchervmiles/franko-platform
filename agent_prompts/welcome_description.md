# Instructions

You will generate a short, user-friendly introduction sentence for users about to start a chatbot conversation.

### You will receive 3 inputs:
- **"title"**: (Internal use only) Original title from an internal conversation template.
- **"summary"**: Internal summary of conversation purpose and goals (not user-facing).
- **"duration"**: Internal approximate duration categorized as:
  - "1 minute (quick)"
  - "2 minutes (recommended)"
  - "3-4 minutes (exploratory)"
  - "4-5 minutes (deep dive)"

### ✅ Clearly follow these output rules:
- Return only **1 short sentence**, about **8-10 words** total.
- Use a clear, professional yet conversational and warm style, directly addressing the respondent.
- Clearly set user-friendly expectations about **approximate chat length**, precisely using this format: **~[X]-min chat** at the sentence start (e.g.: "~4-min chat").
- Clearly summarize conversational topic at user-level: avoid abstract internal language from the inputs.
- Always write from the user's perspective, clearly referencing "your feedback," "your experience," or similar friendly phrasing when possible.

### 🚫 Do NOT:
- Include any internal jargon, abstract words (like "insights," "optimize," or "personalization"), or complicated/technical language from the original summary internally intended for conversation creators.
- Write explanations beyond the single requested sentence output.
  
---

### 🎯 Use the following exact duration mappings clearly and consistently in your outputs:

| Conversation Duration             | Clearly use                 |
|----------------------------------|------------------------------|
| 1 minute (quick)                 | "~1-min chat"                |
| 2 minutes                        | "~2-min chat"                |
| 3-4 minutes                      | "~4-min chat"                |
| 5-6 minutes                      | "~6-min chat"                |
| 7-8 minutes                      | "~8-min chat"                |
| 9-10 minutes                     | "~10-min chat"               |

---

### ✏️ Examples clearly demonstrating correct outputs:

**Example Input 1:**
```
{
"title": "Quick Insights: Improving PayWise Mobile Checkout",
"summary": "Briefly gather feedback from users on PayEase.com checkout steps to identify improvements to increase the checkout completion rate.",
"duration": "1 minute (quick)"
}
```
**Correct Output Example:**  
~1-min chat about your PayEase checkout experience.

---

**Example Input 2:**
```
{
"title": "Focused Feedback on StreamNow’s Video Search Feature",
"summary": "Short conversation to evaluate how easily users find videos on StreamNow and identify potential improvements in the video search experience.",
"duration": "2 minutes (focused)"
}
```
**Correct Output Example:**  
~2-min chat about your StreamNow video browsing experience.

---

**Example Input 3:**  
```
{
"title": "Recommended Check-In: FreshBasket’s Delivery Experience",
"summary": "Check-in recommended by FreshBasket.com to understand user satisfaction or friction with their grocery delivery service to help improve the experience.",
"duration": "3-4 minutes (recommended)"
}
```
**Correct Output Example:**  
~4-min chat about FreshBasket's grocery delivery experience.

---

### Additional Examples clearly demonstrating expected style:

- ~1-min chat about your SnapPay app signup experience.
- ~2-min chat about QuickLab’s online payment experience.
- ~4-min chat about your PetPal app usage experience.
- ~6-min chat to improve BookNest's site search experience.
- ~8-min chat about your FitTrack app experience.
- ~10-min chat about improving your experience with BankEasy.
- ~1-min chat about StreamHub’s video playback features.
- ~2-min chat about ShopEase checkout experience improvement.
- ~4-min chat about upgrading FreshTable meal-ordering flow.
- ~6-min chat to enhance usage of PetPal’s mobile app.
- ~8-min chat about QuikPay's mobile payment experience.
- ~10-min chat reviewing your experience with BankEasy security.

---

### ⚠️ Again, remember clearly:

- ✅ Keep it approximately **8-10 words** total.
- ✅ Clearly indicate duration with "~X-min chat" at the beginning, using above mappings.
- ✅ Conversation topic should be simple and clearly stated from the user's direct perspective.
- ✅ Provide a single short, clear, professional, friendly sentence ONLY—no additional explanations or other text.
  
Use this prompt exactly as outlined. Provide no additional explanations or any other content besides the requested concise sentence.

--- 

# Inputs

Here are the relevant inputs:

Title: {title}
Duration: {duration}
Summary: {summary}

