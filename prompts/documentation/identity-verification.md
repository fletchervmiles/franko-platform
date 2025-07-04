# Franko Identity Verification (Optional)

Give Franko the power to greet users by name and link conversations to real accounts.

## Why verify?

* Personalised greetings and smarter responses
* View conversations grouped by user in your dashboard
* Link feedback to customer records for analysis

## How it works

1. Generate a **verification secret** in the **Connect → Identity verification** card.
2. On your server, compute a SHA-256 HMAC of the `user_id` using the secret.
3. Expose the values to the browser with the `window.FrankoUser` snippet **before** the embed script.

Franko recreates the HMAC server-side. If it matches, the user is verified. If not, Franko discards the `user_id` but continues the conversation anonymously.

## Server-side example (Node.js)

```js
import crypto from "crypto";

const SECRET = process.env.FRANKO_VERIFICATION_SECRET; // keep this safe!
const userId = currentUser.id;                         // any unique string/UUID

const userHash = crypto.createHmac("sha256", SECRET)
                       .update(userId)
                       .digest("hex");
```

## Client snippet

```html
<script>
window.FrankoUser = {
  user_id: "USER_ID_FROM_SERVER",
  user_hash: "HASH_FROM_SERVER",
  user_metadata: {
    name: "Jane Doe",
    email: "jane@acme.com",
    company: "Acme Inc"
  }
}
</script>
```

Add this **before** the main embed snippet.

## Stored data & display logic

| Field | Stored? | Shown in dashboard | Notes |
|-------|---------|--------------------|-------|
| `user_id` | ✔️ | ✔️ (if hash valid) | Primary identifier |
| `user_hash` | ❌ | ❌ | Used only for verification |
| `user_metadata` | ✔️ | ✔️ | JSON blob for extra context |
| `name`, `email` (extracted) | ✔️ | ✔️ | Convenience columns |

## FAQ

**Do I have to verify users?**  
No. Skip the snippet if anonymity is fine.

**Can I regenerate the secret?**  
Yes – click **Regenerate** in the Connect tab. Update your server-side code accordingly.

**Is HTTPS required?**  
Yes. Never expose the secret over insecure HTTP.

Need more detail? Email **support@franko.ai**. 