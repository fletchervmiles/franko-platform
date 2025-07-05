# Embed with a Custom Trigger

The **Custom Trigger** option lets you open a Franko modal from *any* element – button, link, navbar item, or even a JavaScript function.

---

## 1 · Copy your script

1. In **Connect → Custom Trigger** click **Copy**.
2. The snippet contains your modal slug and loads Franko in **manual** mode.

```html
<script>
  … generated code …
</script>
```

---

## 2 · Paste before `</body>`

Add the snippet to every page where the trigger lives – preferably just before the closing `</body>` tag.

---

## 3 · Add your trigger

Any element can open the modal:

```html
<button onclick="FrankoModal.open()">Give Feedback</button>
```

**Multiple modals?** Pass a slug:

```js
FrankoModal.open("bug-report");
```

You can fire this from on-click handlers, JS events, or your SPA router.

---

## 4 · Example patterns

| Use-case | Code |
|----------|------|
| Open from navbar link | `<a href="#" onclick="FrankoModal.open()">Chat</a>` |
| Open when user scrolls 50% | ```js
window.addEventListener('scroll', () => {
  if (window.scrollY > document.body.scrollHeight * 0.5) {
    FrankoModal.open();
  }
});
``` |
| One page, two modals | Install two snippets with different `data-modal-slug` values and open each by slug. |

---

## 5 · FAQ

**Can I conditionally load the script?** Yes – render it only when the user meets your criteria (logged in, on a certain page, etc.).

**Will unused scripts hurt performance?** No – each script is tiny (<5 kB) and loads async.

**Does the script inject a bubble?** No. Manual mode stays invisible until you call `FrankoModal.open()`.

Need more? See our [troubleshooting tips](./bubble.md#5--troubleshooting) or email **fletcher@franko.ai**. 