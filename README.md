# 🚀 KESHAV.AI — Mission Control v2.0
### AI Mock Interviewer · DRDO · ISRO · NIC · NPCIL · ECE Division
### Powered by Google Gemini (FREE)

---

## ⚡ Quick Start (3 steps)

### 1. Install & Run
```bash
# Open this folder in VS Code, then open Terminal (Ctrl + `)
npm install
npm run dev
# Open: http://localhost:3000
```

### 2. Get Free Gemini API Key
→ Go to **https://aistudio.google.com**
→ Sign in with Google account
→ Click **"Get API Key"** → **"Create API Key"**
→ Copy the key (starts with `AIzaSy...`)

### 3. Add Key to App
→ Open **http://localhost:3000**
→ Go to **CONFIG** (top nav)
→ Paste Gemini key → **SAVE** → **TEST CONNECTION**

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🚀 Space Theme UI | Full animated starfield, HUD-style interface |
| 💌 Personal Popup | Custom message from you shown when Keshav opens site |
| 🎙️ Live Mock Interview | 3-phase: Intro → Technical → HR with camera + voice |
| 🤖 Gemini AI Feedback | Personalised scoring, strengths, improvements |
| 🧠 AI Follow-up Questions | Gemini generates follow-ups based on Keshav's actual answers |
| 📡 YouTube Question Extraction | Gemini reads actual YouTube video content |
| 🎯 4 Organisations | DRDO, ISRO, NIC, NPCIL — ECE specific |
| 📹 Live Camera | HUD-style camera overlay during interview |

---

## 💌 Edit the Popup Message

Open `src/components/PopupMessage.jsx` and edit the `POPUP_CONFIG` object at the top:

```js
const POPUP_CONFIG = {
  enabled: true,
  showOnce: true,          // shows once per day
  senderName: "Your biggest fan 💫",
  message: `Your message here...`,
  emoji: "💌",
  title: "A message for you, Keshav"
}
```

---

## 🌐 Deploy to Internet (Free)

### Netlify (Easiest)
```bash
npm run build
# Go to netlify.com/drop → drag the 'dist' folder
```

### Vercel
```bash
npm install -g vercel
vercel
```

---

## 📁 Project Structure
```
keshav-v2/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx         # HUD navigation bar
│   │   ├── StarField.jsx      # Animated space background
│   │   └── PopupMessage.jsx   # Personal popup message ← EDIT HERE
│   ├── pages/
│   │   ├── Home.jsx           # Mission control home page
│   │   ├── Interview.jsx      # AI mock interview engine
│   │   ├── YouTubeExtract.jsx # Gemini YouTube analysis
│   │   └── Settings.jsx       # Gemini API key + config
│   ├── data/
│   │   └── questions.js       # 100+ real interview questions
│   └── styles/
│       └── global.css         # Space theme CSS
└── package.json
```

---

## 🔑 API Used
- **Google Gemini 2.0 Flash** — FREE (60 requests/min)
- **Browser Web Speech API** — FREE (built into Chrome)
- **Browser MediaDevices API** — FREE (built-in camera)

**Total cost: ₹0** 🎉

---

**Best of luck Keshav. You've got this! 🚀**
