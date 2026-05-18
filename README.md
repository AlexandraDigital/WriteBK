# Manuscript Studio

AI-powered writing app built with Vite + React, deployed on Cloudflare Pages.

## Cloudflare Pages Setup

**Build settings:**
| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |

**Environment variable:**

In your Cloudflare Pages project → Settings → Environment Variables, add:

| Variable name | Value |
|---|---|
| `VITE_GROQ_API_KEY` | your Groq API key |

> **Important:** Vite only exposes env vars prefixed with `VITE_` to the browser.
> Rename your existing `GROQ_API_KEY` variable to `VITE_GROQ_API_KEY` in the
> Cloudflare Pages dashboard. The key is never stored — it's baked into the
> build at deploy time and sent only to Groq.

## Local Development

```bash
npm install
```

Create a `.env.local` file:
```
VITE_GROQ_API_KEY=your_key_here
```

Then run:
```bash
npm run dev
```

## Stack

- React 18
- Vite 5
- Groq API (llama-3.3-70b-versatile)
- Cloudflare Pages (static hosting)
