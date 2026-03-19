# ArturitAI EVO — Modular Build

> **AI-powered code generation** with 25-factor QA, unlimited refinement loops,
> transparent thinking panel, Pyodide Python runner, and PWA support.

---

## Features

- 🤖 **25-Factor Quality Engine** — checks entry points, imports, error handling, naming, environment compatibility, and 20 more criteria on every generated script
- ♾️ **Unlimited QA Refinement** — iterates until all checks pass (10-pass no-progress safety brake)
- 🧠 **Transparent Thinking Panel** — every reasoning step, design decision, and QA fix shown in real time
- 🐍 **Python in the Browser** — runs Python code via Pyodide (WebAssembly), no server needed
- ⚡ **JavaScript Sandbox** — runs JS/TS in a secure iframe instantly
- 🌐 **Web Search** — Wikipedia + DuckDuckGo fallback for factual queries
- 🃏 **Script Cards** — compact cards replace raw code blocks; tap to open fullscreen overlay
- ✕ **Floating EXIT Button** — always-visible pulsing FAB to close any running script
- 📱 **PWA-Ready** — installable, offline-capable with service worker
- 🎨 **Dark / Light theme** — glass morphism design system

---

## Project Structure

```
arturitai/
├── index.html          ← Minimal HTML shell (all IDs preserved)
├── manifest.json       ← PWA manifest
├── service-worker.js   ← Cache-first offline support
├── css/
│   └── style.css       ← Full design system (1 500+ lines)
├── js/
│   ├── split.js        ← SplitPrompt v3: WEB|CODE|ANALYZE|CHAT classifier
│   ├── knowledge.js    ← KB_LANG: 15-language command stubs
│   ├── qa.js           ← QA_ENGINE + v13/v14 25-factor patches
│   ├── executor.js     ← runCode(): Pyodide + iframe sandbox
│   ├── thinking.js     ← Thinking panel: beginThink/addStep/updateStep/finishThk
│   ├── engine.js       ← ScriptMaker · CodeAnalyzer · WebLookup · processQuery
│   ├── ui.js           ← Toast · Script card overlay · EXIT FAB
│   └── main.js         ← Global state (S) · DOM helpers · CodeGen · ContextMgr
└── assets/
    └── icons/          ← PNG icons: 72 96 128 144 152 192 384 512 px
```

---

## Quick Start (Local)

```bash
# Option A — Python (any version)
cd arturitai
python3 -m http.server 8080
# Open http://localhost:8080

# Option B — Node.js
npx serve arturitai

# Option C — VS Code
# Install "Live Server" extension → right-click index.html → Open with Live Server
```

> **Important:** You must serve via HTTP(S), not `file://`. The service worker
> and Pyodide both require a proper origin.

---

## Deploy to GitHub Pages (Free Hosting)

### Step 1 — Create a GitHub account
Go to [github.com](https://github.com) and sign up (free).

### Step 2 — Create a new repository

1. Click the **+** icon → **New repository**
2. Repository name: `arturitai` (or any name you like)
3. Set to **Public**
4. Click **Create repository**

### Step 3 — Upload the files

**Option A — GitHub Web UI (no Git required):**

1. Inside your new repo, click **uploading an existing file**
2. Drag and drop the entire `arturitai/` folder contents (not the folder itself — drag everything *inside* it)
3. Make sure the structure shows `index.html` at the root level
4. Scroll down, write a commit message like `Initial ArturitAI upload`
5. Click **Commit changes**

**Option B — Git command line:**

```bash
cd arturitai
git init
git add .
git commit -m "ArturitAI v15 — initial commit"
git remote add origin https://github.com/YOUR_USERNAME/arturitai.git
git branch -M main
git push -u origin main
```

### Step 4 — Enable GitHub Pages

1. In your repository, click **Settings** tab
2. Scroll down to **Pages** in the left sidebar
3. Under **Source**, select **Deploy from a branch**
4. Branch: **main** | Folder: **/ (root)**
5. Click **Save**
6. Wait 1–3 minutes for deployment

### Step 5 — Access your live site

Your site will be live at:
```
https://YOUR_USERNAME.github.io/arturitai/
```

GitHub will show a blue banner in Settings → Pages when it's ready.

---

## Optional: Custom Domain

1. Buy a domain (e.g. from Namecheap, Google Domains, Cloudflare)
2. In GitHub Pages settings, enter your domain in the **Custom domain** field
3. Add a `CNAME` file to your repo root containing just your domain:
   ```
   arturitai.yourdomain.com
   ```
4. At your DNS provider, add a `CNAME` record:
   - Host: `arturitai` (or `@` for root domain)
   - Value: `YOUR_USERNAME.github.io`
5. Wait up to 24h for DNS propagation
6. Enable **Enforce HTTPS** in GitHub Pages settings

---

## Using an Anthropic API Key (Optional)

ArturitAI works fully offline with its built-in knowledge base. For the
highest-quality AI responses, add an API key:

1. Get a key at [console.anthropic.com](https://console.anthropic.com)
2. Open ArturitAI → ☰ Menu → **Settings** → **API Key** field
3. Paste your `sk-ant-…` key
4. The key is stored only in your browser's memory (not sent anywhere except Anthropic)

---

## Updating the App

To push an update to GitHub Pages:

```bash
# Edit your files locally, then:
git add .
git commit -m "Update: describe your changes"
git push
```

GitHub Pages auto-redeploys within ~1 minute.

---

## PWA Installation

Once hosted over HTTPS, users can install ArturitAI as a native-like app:

- **Chrome/Edge (Desktop):** Click the install icon (⊕) in the address bar
- **Chrome (Android):** Tap ⋮ → **Add to Home Screen**
- **Safari (iOS):** Tap the Share button → **Add to Home Screen**

The service worker caches all static assets so the app works offline after
the first visit.

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| Core chat | ✅ | ✅ | ✅ | ✅ |
| JS sandbox | ✅ | ✅ | ✅ | ✅ |
| Python (Pyodide) | ✅ | ✅ | ✅ 16.4+ | ✅ |
| PWA install | ✅ | ⚠️ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |

---

## Troubleshooting

**"Python unavailable" message:**
Pyodide downloads ~10 MB on first use. Ensure you have a good internet
connection and are not on a strict corporate firewall.

**Scripts not running on `file://`:**
Always use a local server (see Quick Start above).

**GitHub Pages showing 404:**
Make sure `index.html` is at the *root* of the repository, not inside a subfolder.

**Service worker not updating:**
Hard-refresh with `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to bypass cache.

---

## License

MIT — free to use, modify, and distribute.

---

*Built with ArturitAI v15 — 25-Factor QA Engine · Unlimited Refinement · Transparent Thinking*
