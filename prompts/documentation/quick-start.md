# Franko Embed – Quick Start

## 1 · Copy your embed code

Open the **Connect** tab in the Franko dashboard and choose either:

* **Floating Chat Bubble** (recommended)
* **Custom Trigger** (manual control)

Click **Copy** to grab the snippet generated for your modal.

## 2 · Paste before `</body>`

Place the snippet on every page where you want the chat bubble to appear—ideally just before the closing `</body>` tag.

```html
<!-- Example (Floating Chat Bubble) -->
<script>
  … generated code …
</script>
```

## 3 · (Optional) Add identity verification

To personalise conversations for logged-in users, add a `window.FrankoUser` snippet **before** the embed script, as shown in the [Identity Verification guide](./identity-verification.md).

## 4 · Test your installation

1. Load a page with the embed code.
2. The chat bubble should appear in the bottom-right corner.
3. Click the bubble – the modal should open instantly.

### Troubleshooting

| Symptom | Possible Cause | Fix |
|---------|----------------|-----|
| Bubble not visible | JavaScript error | Open browser console, look for errors. |
| Mixed-content warning | Site served over HTTP | Serve your site and Franko over HTTPS. |
| Modal opens but is blank | CORS or CSP blocks | Ensure `/embed/*` and `/embed.js` are not blocked by your CSP, ad-blockers, or proxy. |

Need more help? Reach us at **support@franko.ai**. 