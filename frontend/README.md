# MedBridge Frontend

**Medicine Expiry & Donation Bridge** — a portfolio/demo prototype for coordinating potentially eligible surplus medicines between donors and verified healthcare organizations.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router
- TanStack Query (server state)
- Zustand (auth session, UI state)
- React Hook Form + Zod
- Axios
- MSW (mock API)
- Recharts
- Lucide React
- Framer Motion
- Vitest + React Testing Library

## Getting Started

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Demo Accounts (Mock Mode)

| Role | Email | Password |
|------|-------|----------|
| Donor (ABC Pharmacy) | `donor@abcpharmacy.com` | `password123` |
| Recipient (Hope Care Clinic, verified) | `recipient@hopecare.com` | `password123` |
| Recipient (pending verification) | `recipient-pending@clinic.com` | `password123` |
| Admin | `admin@medbridge.com` | `password123` |

## Scripts

```bash
npm run dev      # Start dev server with MSW (when VITE_MOCK_MODE=true)
npm run build    # Production build
npm run preview  # Preview production build
npm test         # Run component tests
```

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=MedBridge
VITE_MOCK_MODE=true
```

Set `VITE_MOCK_MODE=false` to connect to the real FastAPI backend.

## Architecture

```
src/
├── components/   # Reusable UI (common, layout, auth, domain)
├── pages/        # Route-level pages by role
├── layouts/      # Page shells (Public, Donor, Recipient, Admin)
├── hooks/        # TanStack Query hooks
├── store/        # Zustand (auth, UI)
├── services/     # Axios API layer
├── mocks/        # MSW handlers + demo data
├── types/        # TypeScript interfaces
├── schemas/      # Zod validation
└── utils/        # Helpers
```

## Regulatory Disclaimer

MedBridge is a portfolio/demo application. It does **not** independently determine whether a medicine is legally eligible for redistribution. All listings display:

> Passed MedBridge preliminary eligibility screening — authorized review required.

## Security Note

Frontend role checks and disabled buttons are UX only. The backend must enforce authentication, RBAC, and authorization.
