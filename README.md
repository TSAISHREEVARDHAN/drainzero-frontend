# DrainZero Frontend

A polished React frontend for **DrainZero**, a personal tax optimization platform built for Indian taxpayers. The application helps users compare tax regimes, detect tax leakage, explore deductions, simulate scenarios, upload documents, and interact with an AI tax assistant through a guided dashboard experience.

---

## Overview

DrainZero is designed as a **diagnostic and advisory platform** rather than a tax filing tool. The frontend focuses on making tax optimization simple, visual, and personalized.

Users can:
- sign up and log in securely
- complete onboarding and profile setup
- enter salary and deduction details
- run category-aware tax analysis
- compare old vs new regime outcomes
- explore personalized insights and recommendations
- use interactive tax planning tools in one dashboard

---

## Problem Statement

Many Indian taxpayers know how to file taxes, but not how to **optimize them legally**. Existing tools often stop at basic tax calculation and do not clearly show:
- where money is being lost
- which deductions are still unused
- which regime is better for a specific profile
- what concrete next steps can reduce tax burden

DrainZero addresses this gap with a more guided, interactive, and user-friendly experience.

---

## Key Features

### Core Analysis
- **Regime Comparison** — side-by-side comparison of Old vs New tax regime
- **Tax Leakage Detection** — highlights missed deductions and exemptions
- **Tax Health Score** — simple score-based view of tax optimization readiness
- **Actionable Recommendations** — personalized next-step suggestions
- **Salary Structure Analysis** — helps users think about tax-efficient salary components

### Advanced Tools
- **Legal Tax Loopholes** — strategy-oriented exploration screen
- **Document Upload** — upload workflows for documents such as Form 16 / AIS
- **What-If Simulator** — slider-based live tax impact simulation
- **Deductions Explorer** — structured view of 50+ deduction sections
- **Deadline Reminders** — important tax and compliance timelines
- **Investment Guide** — tax-aware investment guidance pages
- **Benefits Explorer** — discover benefits and schemes relevant to the user profile

### Platform Experience
- secure authentication with onboarding flow
- protected routes for signed-in users
- reusable profile-driven analysis
- responsive dashboard UI
- AI assistant integration hooks via backend APIs

---

## User Flow

1. User lands on the product homepage
2. User signs up or logs in
3. User completes onboarding
4. User fills income and deduction details
5. User selects analysis category
6. Backend analysis is triggered
7. Results are displayed in a strategy dashboard
8. User can explore deeper modules like simulator, deductions, benefits, and report pages

---

## Tech Stack

### Frontend
- **React 19**
- **Vite**
- **React Router DOM**
- **Ant Design**

### Authentication and Data
- **Supabase Auth**
- Supabase client integration for session management

### Backend Integration
- External backend API configured through environment variables
- Supports analysis, AI assistant, document upload, loopholes, benefits, and history endpoints

### Deployment
- **Vercel** ready
- **Netlify** configuration included

---

## Architecture Notes

- SPA routing handled through `react-router-dom`
- Route protection implemented using a reusable `ProtectedRoute`
- Authentication state managed using `AuthContext`
- API integration centralized in `src/config/api.js`
- Supabase client configured in `src/config/supabase.js`
- Shared constants and theming kept modular
- Profile data mapping and save flow handled through service layer

---

## Project Structure

```text
src/
├── components/         # Reusable UI components and route guards
├── config/             # Supabase and backend API configuration
├── context/            # Global auth context
├── hooks/              # Custom hooks
├── pages/              # Landing page, auth pages, dashboard, feature pages
├── services/           # Profile save/fetch/analysis helpers
├── styles/             # Global styles and theme files
├── App.jsx             # App routes
└── main.jsx            # Entry point
```

---

## Main Routes

### Public
- `/`
- `/login`
- `/signup`
- `/auth/callback`

### Protected
- `/dashboard`
- `/profile`
- `/category-selection`
- `/analysis`
- `/feature/tax-health`
- `/feature/tax-leakage`
- `/feature/recommendations`
- `/feature/regime-comparison`
- `/feature/salary-analysis`
- `/feature/loopholes`
- `/feature/documents`
- `/feature/what-if`
- `/feature/deductions`
- `/feature/deadlines`
- `/feature/investment-guide`
- `/feature/benefits`
- `/feature/report`

---

## Environment Variables

Create a `.env` file and add:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=your_backend_url
```

---

## Local Setup

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

---

## Deployment Notes

### Vercel
This repo already includes a `vercel.json` rewrite so frontend routes work correctly in production.

### Netlify
This repo also includes a `netlify.toml` file for build settings and SPA redirects.

---

## Highlights from the Current Frontend Implementation

- uses **PKCE-based Supabase auth flow**
- includes onboarding-aware protected routing
- enforces deduction caps before saving profile values
- supports backend timeout handling and friendly error messaging
- organizes tax features into a unified strategy dashboard
- includes dedicated pages for simulation, documents, investments, deductions, and reminders

---

## Team

**Built by:**
- T Sai Shree Vardhan
- Shradhha Uplanchiwar

---

## Positioning

DrainZero is best described as a:

> **Personal Fiscal Optimization Engine for Indian taxpayers**

It is intended to help users understand tax-saving opportunities clearly and interactively before final filing decisions are made.

---

## Disclaimer

DrainZero is an informational and advisory product experience. It is **not a substitute for professional CA or legal advice**.

---

## Submission Note

This repository contains the **frontend application** for DrainZero. Authentication is handled through Supabase, while tax analysis and AI-backed flows are connected through external backend APIs.
