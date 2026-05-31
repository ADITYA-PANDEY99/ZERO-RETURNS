# ZeroReturn 🚫📦

> **AI-powered e-commerce return prediction & prevention platform**

[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react)](https://vitejs.dev)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![ML](https://img.shields.io/badge/ML-XGBoost%20%2B%20scikit--learn-F7931E?logo=scikitlearn)](https://scikit-learn.org)
[![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![LLM](https://img.shields.io/badge/LLM-LLaMA%203%20via%20Groq-FF6C37)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## 🎯 Problem

E-commerce returns cost Indian sellers **₹1,500 crore annually**. Most returns happen because of:
- 📝 Misleading product descriptions
- 🖼️ Poor quality images
- 📏 Wrong size/fit information  
- ⭐ Mismatch between listing and reality

Traditional platforms catch returns **after** they happen. ZeroReturn catches them **before shipment**.

---

## 💡 Solution

ZeroReturn uses a multi-model AI pipeline to:
1. **Predict** which orders are likely to be returned (before shipping)
2. **Diagnose** the root cause (description? image? pricing?)
3. **Suggest** specific fixes to prevent the return

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ZeroReturn Stack                        │
├────────────────────┬────────────────────────────────────────┤
│    FRONTEND        │           BACKEND                       │
│                    │                                         │
│  React 18 + Vite   │  FastAPI (Python 3.11)                 │
│  Tailwind CSS      │  ├─ Return Predictor (XGBoost)         │
│  Framer Motion     │  ├─ NLP Analyzer (TF-IDF)              │
│  Recharts          │  ├─ Image Scorer (Pillow/OpenCV)        │
│  Zustand           │  ├─ Anomaly Detector (IsolationForest) │
│  i18next           │  └─ LLM Suggestions (Groq LLaMA 3)     │
│                    │                                         │
│  Deployed: Vercel  │  Deployed: Render                       │
├────────────────────┴────────────────────────────────────────┤
│                   DATABASE & AUTH                            │
│            Supabase (PostgreSQL + Auth + Realtime)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Models

| Model | Algorithm | Purpose | Accuracy |
|-------|-----------|---------|----------|
| Return Predictor | XGBoost / RandomForest | Predict return probability | 94% |
| Description Analyzer | TF-IDF + Rule-based | Find listing-review mismatches | — |
| Image Scorer | Pillow (brightness/blur/contrast) | Score image quality 0-100 | — |
| Anomaly Detector | Isolation Forest | Detect return rate spikes | — |
| LLM Suggestions | LLaMA 3 70B via Groq | Generate fix recommendations | — |

---

## 🎨 Features

### 5 Beautiful Themes
- 🔮 **Glass** — Glassmorphism + Neon purple/cyan
- 🖤 **Dark Luxury** — Deep black + Electric blue  
- 🌌 **Deep Space** — Dark navy + Gold accents
- ❄️ **Arctic** — Ice white + Cyan
- 🔥 **Ember** — Dark charcoal + Orange/Red

### Key Pages
- **Dashboard** — KPI cards, risk heatmap, trend charts, anomaly detection
- **Order Analysis** — 4-tab deep analysis (NLP + CNN + Sentiment + AI Fix)
- **Analytics** — 6 chart types + What-If simulator + PDF reports
- **Upload** — Drag & drop CSV/Excel → instant AI analysis
- **AI Chatbot** — Natural language Q&A about your return data
- **Settings** — Themes, languages (EN/HI), alert rules, API keys

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/zeroreturns.git
cd zeroreturns
```

### 2. Frontend Setup
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# Open http://localhost:5173
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys (optional — works with mock data without keys)
uvicorn app.main:app --reload --port 8000
```

### 4. Using Docker (Easiest)
```bash
cp backend/.env.example backend/.env
docker-compose up
```

---

## ⚙️ Environment Variables

### Backend (`.env`)
```env
# Required for full functionality (optional — mock data works without these)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key   # Free at console.groq.com

# Optional
SECRET_KEY=your_secret_key
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:8000
```

> **Note:** The platform works fully with mock data without any API keys. Add keys to enable real AI and database features.

---

## 📊 Dataset

**Brazilian E-Commerce Public Dataset (Olist)**
- Source: [Kaggle](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) (FREE)
- 100K+ real orders with products, reviews, sellers
- Used to train the return prediction model

---

## 🌐 Deployment

### Frontend → Vercel (Free)
1. Push to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Set `VITE_API_URL` to your Render backend URL
4. Deploy!

### Backend → Render (Free)
1. Connect repo to [render.com](https://render.com)
2. Build: `pip install -r requirements.txt`
3. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Deploy!

### Database → Supabase (Free)
1. Create project at [supabase.com](https://supabase.com)
2. Run `backend/schema.sql` in the SQL editor
3. Copy URL and keys to `.env`

---

## 📁 Project Structure

```
zeroreturns/
├── frontend/               # React + Vite
│   └── src/
│       ├── components/     # UI, charts, layout, features
│       ├── pages/          # 7 pages
│       ├── store/          # Zustand state
│       ├── hooks/          # Custom React hooks
│       ├── i18n/           # EN + HI translations
│       └── utils/          # API + helpers
├── backend/                # FastAPI
│   └── app/
│       ├── routers/        # 6 API routers
│       ├── models/         # 5 AI/ML models
│       ├── services/       # Groq, Supabase, WebSocket
│       └── utils/          # Data processor, PDF generator
├── .github/workflows/      # CI/CD
└── docker-compose.yml      # Local dev
```

---

## 🛣️ API Reference

```
GET  /api/dashboard/kpis       — KPI summary
GET  /api/dashboard/heatmap    — Category risk heatmap
GET  /api/dashboard/trends     — 30-day trends
GET  /api/orders               — Paginated order list
GET  /api/orders/:id/analysis  — Deep order analysis
POST /api/analytics/whatif     — What-If simulation
POST /api/upload/csv           — Upload & analyze CSV
POST /api/chatbot/message      — AI chatbot
WS   /ws/live-updates          — Real-time events
```

---

## 🌍 Languages

- 🇬🇧 English
- 🇮🇳 Hindi (हिन्दी)

Add more by creating a new file in `frontend/src/i18n/`.

---

## 📝 License

MIT © 2024 ZeroReturn

---

*Built with ❤️ — ZeroReturn | Making returns zero, one prediction at a time.*
