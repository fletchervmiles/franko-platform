# Link Feedback to Logged-in Users (Identity Verification)

With identity verification you can see *who* said what in your Franko dashboard. It does **not** change the visitor's experience – the modal looks identical whether the user is verified or anonymous.

---

## 1 · Generate your workspace secret

In **Connect → Identity Verification** click **Generate** (or **Regenerate**).

> One secret per workspace. If you rotate it you must update your server-side code everywhere you sign the hash.

---

## 2 · Hash the `user_id` on your server

```js
import crypto from "crypto";

const SECRET = process.env.FRANKO_VERIFICATION_SECRET;  // keep this safe!
const userId = currentUser.id;                          // any unique string/UUID

const userHash = crypto.createHmac("sha256", SECRET)
                       .update(userId)
                       .digest("hex");
```

---

## 3 · Expose the values in the browser **before** the embed script

```html
<script>
window.FrankoUser = {
  user_id: "USER_ID_FROM_SERVER",
  user_hash: "HASH_FROM_SERVER",
  user_metadata: {
    name: "Jane Doe",
    email: "jane@acme.com",
    plan: "Pro"
  }
}
</script>
```

*Only `user_id` and `user_metadata` are stored.* `user_hash` is discarded after verification.

---

## What happens if the hash is missing or invalid?

Franko falls back to anonymous mode. Conversations are stored, but the **User** column shows "Anonymous".

---

## FAQ

| Question | Answer |
|----------|--------|
| Do I have to verify users? | No – skip the snippet if anonymity is fine. |
| Does it work with the Direct-Link URL? | Direct links open a new tab and cannot access your session, so identity verification is ignored there. |
| Can I regenerate the secret? | Yes. Click **Regenerate** and update your HMAC code. |
| Is HTTPS required? | Yes. Never expose the secret over insecure HTTP. |
| What data is stored? | `user_id` + all fields inside `user_metadata`. `user_hash` is thrown away. |

Need more? Email **support@franko.ai**. 