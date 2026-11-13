# HumanAuthn landing (humanauthn.com)

Static landing for HumanAuthn with two A/B variants and an ES/EN toggle. Vite, vanilla JS, no framework.

```bash
npm install
npm run dev      # http://localhost:3100
npm run build    # outputs dist/
```

## A/B variants

Both variants follow the HumanAuthn Figma file.

- **A** (`src/pageA.js`, `src/copyA.js`, `src/a.css`): frame "humanauthn.com V1.0 (A)". Privacy angle
  ("Know it's your customer, on any device, without storing their face.").
- **B** (`src/pageB.js`, `src/copyB.js`, `src/b.css`): desktop frame of "Diseño de Home de HumanAuthn" on page
  "humanauthn.com V1.0 (B)". Identity angle ("Self-custody identity. Human-powered access."). Its "Download demo brief"
  form builds a text file in the browser; nothing is sent.

Images in `public/img/` were taken from the Figma canvas (export is disabled for viewers). Swap them for the original
exports when the design team sends them.

URL structure for the experiment:

| Variant | URL | Canonical |
| --- | --- | --- |
| A | `https://humanauthn.com/` | `https://humanauthn.com/` (primary) |
| B | `https://humanauthn.com/?variant=b` | `https://humanauthn.com/` |

Both variants share the same meta title and description (`META` in `src/i18n.js`) and the same canonical URL.
Old links (`?v=a|b`, `/a`, `/b`) still work and are rewritten to this structure.

Every page view pushes `ha_variant_view` to `window.dataLayer` (and `gtag` if present) with `ha_variant` and `ha_lang`.
CTA clicks push `ha_cta_click` with the `cta` name. Add the GTM/GA4 snippet to `index.html` to collect them.

## Language

`?lang=es|en` → path `/es` or `/en` → saved choice → browser language. The toggle in the navbar saves the choice.
Page copy lives in `src/copyA.js` and `src/copyB.js`. Meta tags, links and video ids are in `src/i18n.js`.

## "See how it works" video

YouTube ids in `VIDEOS` (`src/i18n.js`). Spanish: `PQpyeU0Bgcl`. English: `ceJDAn1QoW8`.

## Domains

`humanauthn.com` is the main domain. `vercel.json` redirects `www.humanauthn.com`, `humanauthn.org`, `humanauthn.io`
and `humanauthntech.com` to it once those domains point at the same deployment.
