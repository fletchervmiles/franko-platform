ARCHITECTURE DECISION
=====================

After reviewing Option A (Shared Core + Two Dedicated UI Shells) and Option B (Completely Separate Components), I recommend **Option A**.

Why Option A?
• 90 %+ of chat logic (message streaming, objectives, progress-bar, API calls, typing animation, etc.) is identical across dashboard preview _and_ production embed. Extracting this into a **SharedModalCore** hook/component avoids code-duplication while still letting us tailor the visual shells.
• Allows us to optimise bundle size for production by tree-shaking dashboard-only code.
• Easier to keep behaviour consistent: bug-fixes in one surface automatically propagate.
• Provides freedom to diverge the two UIs (e.g. collapsible preview vs full-screen modal) without tangled `isEmbedMode` conditionals.

---

REQUIREMENTS (PLAIN-ENGLISH)
============================

1. **One shared brain, two faces**
   • Build a `useSharedModalCore()` hook (or similar) that encapsulates state management & business logic.
   • Build **DashboardWidgetPreview** (desktop-first, collapsible on mobile)
   • Build **EmbeddedChatModal** (mobile-first, full-screen, close-button)

2. **Embed modal usage modes** (`connect-tab.tsx`)
   a. **Standalone page** → `/embed/{slug}`, always full-screen.
   b. **Floating button** → Script injects bubble, bubble opens modal; modal must cover full viewport (mobile and desktop) with a clear _X_ close icon.
   c. **Custom trigger** → Dev calls `FrankoModal.open()`; same modal behaviour as (b).

3. **Mobile UX fundamentals** (inherit from external chat):
   • Use `100dvh` containers + `max-scale=1` viewport meta tag.
   • Prevent pull-to-refresh / pinch zoom.
   • Adequate 44 px touch targets.
   • Dynamic textarea auto-scroll & height.

4. **Desktop UX**
   • EmbeddedChatModal stays centred with max-width ~640 px and subtle backdrop.
   • Esc key and backdrop click close the modal.

5. **Accessibility**
   • Focus trap inside modal.
   • Announce open/close via ARIA.

---

CLARIFYING QUESTIONS
====================
1. Identity/branding: Should the production modal inherit all advanced colour overrides or only primary brand colour?
2. Progress-bar: Keep it in production modal or hide behind a flag?
3. Do we need an animation when closing (slide-down vs fade)?
4. Should the floating bubble close the modal when clicked again (toggle)?
5. Any analytics events to fire on open/close?

---

IMPLEMENTATION PLAN
===================

Phase 0 – Scaffolding
----------------------
1. Create `components/chat/shared-modal-core.tsx` (returns state, handlers, JSX fragments for messages/ input).
2. Migrate logic from `WidgetPreview` → Shared core. Keep CSS manipulations out.
3. Provide Storybook / test harness for the core.

Phase 1 – EmbeddedChatModal
---------------------------
1. New component in `components/embed/embedded-chat-modal.tsx`.
2. Imports shared core; wraps it in full-screen `<div className="fixed inset-0 h-[100dvh] …">`.
3. Adds top bar with close button (sticky, 48 px height).
4. Implements focus-trap & Esc handling.
5. Integrate in `/embed/[slug]/page.tsx` and `public/embed.js` loader.

Phase 2 – DashboardWidgetPreview Re-work
----------------------------------------
1. Replace `WidgetPreview` with thin shell that calls shared core & renders preview card.
2. Add mobile breakpoint (`md:hidden`) to stack controls & preview.
3. Collapsible preview on XS screens (optional).

Phase 3 – Connect-Tab Integration
---------------------------------
1. Update floating-bubble & custom trigger scripts: On open 👉 inject `<div id="franko-modal-root">` then render EmbeddedChatModal via React Portal into iframe OR same document (decide based on CSP constraints).
2. Ensure close button calls `FrankoModal.close()` and restores bubble visibility.
3. QA across three modes (standalone, bubble, custom).

Phase 4 – Polish & QA
---------------------
1. Cross-browser mobile testing (iOS Safari, Android Chrome, Desktop Safari/Chrome/Edge).
2. Keyboard & screen-reader pass.
3. Lighthouse mobile performance check (target >90).
4. Bundle-size audit; tree-shake dashboard code from production build using dynamic import splitting.

---

RISKS / KNOWN GOTCHAS
======================
• **Scroll/keyboard overlap** on iOS: may need `scrollIntoView` for textarea.
• **Viewport-meta conflicts**: pages embedding the widget might already have a meta tag – overwrite could be breaking. Mitigate by not touching existing tag unless necessary.
• **Gesture prevention vs native PWAs**: Over-aggressive `touchstart` prevention might block legitimate gestures (e.g. pinch-to-zoom for accessibility). Consider feature flag.
• **CSS bleeding**: Host site styles could override modal; use Shadow DOM or CSS Modules with high-specificity prefixes.
• **Portal vs iframe**: Rendering modal in host DOM avoids extra iframe but increases risk of style collisions; iframe adds network cost & complexity.
• **Tree-shaking false-positives**: ensure shared core doesn't pull in heavy dashboard-only deps (lucide, dev logs) into prod bundle.
• **Breaking changes**: Refactor touches many files; regression suite & visual tests recommended.

---

NEXT STEPS
===========
1. Confirm clarifying questions above.
2. Approve Option A & roadmap.
3. Schedule phased implementation, starting with shared core extraction.
