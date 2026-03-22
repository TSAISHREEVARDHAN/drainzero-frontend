# DrainZero — Frontend

Smart Tax Optimization Engine for Indian taxpayers.

## Tech Stack
- React 19 + Vite
- Ant Design (antd)
- Supabase Auth
- React Router v7

---

## Setup Instructions

### 1. Clone and Install
```bash
git clone https://github.com/your-username/drain-zero-frontend.git
cd drain-zero-frontend
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env
```
Open `.env` and fill in:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=your_render_backend_url
```

### 3. Run Locally
```bash
npm run dev
```
Open http://localhost:5173

### 4. Build for Production
```bash
npm run build
```

---

## Deploy to Netlify

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → New Site → Import from GitHub
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables in Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_BACKEND_URL`
6. Click Deploy!

---

## Supabase Google OAuth Setup

1. Supabase Dashboard → Authentication → Providers → Google → Enable
2. Add your Google OAuth Client ID + Secret
3. Add Netlify URL to Redirect URLs:
   `https://your-app.netlify.app`

---

## Project Structure
```
src/
├── config/
│   ├── supabase.js       ← Supabase client
│   └── api.js            ← All backend API calls
├── context/
│   └── AuthContext.jsx   ← Auth state (login/logout)
├── components/
│   ├── ProtectedRoute.jsx
│   └── TaxAssistantChatbot.jsx
├── pages/
│   ├── Landing/
│   ├── Auth/             ← Login + Signup
│   ├── Dashboard.jsx
│   ├── AnalysisForm.jsx
│   └── features/         ← 5 analysis pages
└── styles/
    ├── globals.css
    └── theme.css         ← Color palette
```
