# Embed a Chat Bubble

A floating chat bubble is the fastest way to add Franko to any page. It docks to the bottom-right corner and opens your modal when clicked.

---

## 1 · Copy your snippet

1. In the **Connect** tab choose **Embed a Chat Bubble**.
2. Click **Copy**. The snippet already contains your modal slug and brand colours.

```html
<script>
  … generated code …
</script>
```

---

## 2 · Paste before `</body>`

Add the snippet to every page where you want the bubble to appear – ideally just before the closing `</body>` tag.

> The script loads asynchronously and is < 5&nbsp;kB, so it won't slow down your page.

---

## 3 · Optional tweaks

| What | How |
|------|-----|
| **Show only on some pages** | Include the snippet only on those pages (or behind a route check in your template). |
| **Show only to logged-in users** | Wrap the snippet in an auth check or server conditional so it's rendered only for authenticated visitors. |
| **Change bubble text / colour** | Go to **Appearance → Chat Icon** in the dashboard and hit **Save**. No code changes needed. |
| **Multiple modals** | Install multiple snippets with different `data-modal-slug` values, or call `FrankoModal.open('other-slug')` programmatically. |

---

## 4 · Test your installation

1. Reload the page & look for the bubble in the bottom-right.
2. Click it – the modal should open instantly.

If nothing appears, open the browser console and look for network or CSP errors (common causes listed below).

---

## 5 · Troubleshooting

| Symptom | Possible Cause | Fix |
|---------|----------------|-----|
| Bubble not visible | Script blocked by CSP / ad-blocker | Allow `/embed.js` and `/embed/*` in your CSP or disable the blocker. |
| Mixed-content warning | Site served over HTTP | Serve both your site & Franko over HTTPS. |
| Modal opens but is blank | 3rd-party script error | Check console for JS errors; ensure no global `FrankoModal` conflicts. |

Need more help? Email **support@franko.ai**. 