# Word Counter

The word counter fields throughout the app should reflect the user_words in the chat-response-schema 

db\schema\chat-responses-schema.ts

Here are the files where they appear and how they should be reflected:

---

C:\Users\fletc\Desktop\franko-platform\components\response-card-list.tsx
C:\Users\fletc\Desktop\franko-platform\components\response-card.tsx

These should contain the total user_words - right now I think it's counting total words of the whole transcript

---

C:\Users\fletc\Desktop\franko-platform\components\conversation-responses.tsx

This "Total Customer Words" should be the sum of all the user_words for chat-response-schema entries associated with this chat-instance-schema record

--- 

These should also be reflected in the following component

C:\Users\fletc\Desktop\franko-platform\components\workspace-list.tsx

The same values as
C:\Users\fletc\Desktop\franko-platform\components\conversation-responses.tsx
Plus the last updated value ... which should be reflected by the updated_at field in the chat-instance-schema file. 

---

Does this make sense? Do we need to add any database entries to better handle these updates? Let me know.

---

Schema files for reference

C:\Users\fletc\Desktop\franko-platform\db\schema\chat-instances-schema.ts
C:\Users\fletc\Desktop\franko-platform\db\schema\chat-responses-schema.ts