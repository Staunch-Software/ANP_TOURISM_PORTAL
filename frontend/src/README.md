# Andaman Tourism — Integrated Tourism Management & E-Ticketing Platform

Frontend for the Andaman & Nicobar Islands tourism portal: discovery, planning, slot-based
e-ticketing, group bookings, and four role-based portals (Tourist, Service Provider,
Travel Agency, Admin / Regulatory Authority).

## Stack

React 18 · JavaScript (JSX) · Vite 5 · React Router 6 · Tailwind (configured with the brand
palette) · CSS custom-property design tokens · inline SVG icon set.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview  # serve the production build
npm run lint     # eslint src
```

## Folder structure

```
andaman-tourism-platform/
├─ index.html                      Vite entry, fonts, meta
├─ vite.config.jsx                  dev server + "@" → src alias
├─ tailwind.config.js              brand colours, Poppins/Inter, radii
├─ postcss.config.js
└─ src/
   ├─ main.jsx                     React root
   ├─ App.jsx                      Router + provider + global toast
   ├─ routes/
   │   └─ AppRoutes.jsx            full route table (public + dashboards)
   ├─ layouts/
   │   ├─ MainLayout.jsx           navbar + outlet + footer + floating cart
   │   └─ DashboardLayout.jsx      bare shell for the four portals
   ├─ context/
   │   └─ AppContext.jsx           navigation, session, cart, toasts
   ├─ hooks/
   │   └─ useScrollTop.js
   ├─ services/
   │   ├─ data.jsx                  12 attractions, ferries, bookings, visitors, slots
   │   ├─ images.js                image catalogue
   │   └─ api.js                   mock async API — swap for real endpoints
   ├─ utils/
   │   └─ format.jsx                ₹ formatting, status → badge class
   ├─ styles/
   │   └─ globals.css              design tokens + component classes
   ├─ components/
   │   ├─ common/                  Icons, Section, Field, Steps, EmptyState, QRCode, Toast
   │   ├─ layout/                  Navbar, Footer, CartButton
   │   ├─ home/                    Hero carousel, SearchPanel
   │   ├─ attractions/             AttractionCard
   │   ├─ tickets/                 TicketCard (QR ticket)
   │   └─ dashboard/               Shell (sidebar + topbar), KPI, Chart
   └─ pages/
      ├─ Home.jsx  Explore.jsx  Experiences.jsx  AttractionDetails.jsx
      ├─ PlanTrip.jsx  Ferry.jsx  GroupBooking.jsx  Cart.jsx
      ├─ Booking.jsx  Payment.jsx  Confirmation.jsx  Help.jsx  About.jsx
      ├─ auth/         RoleSelect.jsx  Login.jsx  Register.jsx
      └─ dashboards/   TouristDashboard.jsx  ProviderDashboard.jsx
                       AgencyDashboard.jsx   AdminDashboard.jsx
```

## Routes

| Path | Screen |
| --- | --- |
| `/` | Homepage (hero carousel, search panel, explore, slots, experiences, ticketing) |
| `/explore` · `/experiences` · `/detail` | Attraction listing, experience categories, attraction details |
| `/plan` · `/ferry` · `/group` | Trip planner, ferry schedule, group booking with Excel upload |
| `/booking` · `/cart` · `/payment` · `/confirm` | 6-step wizard, multi-attraction cart, payment, QR confirmation |
| `/login` · `/login-{role}` · `/register` | Role selector, four logins, 3-step registration with OTP |
| `/tourist-dash` · `/provider-dash` · `/agency-dash` · `/admin-dash` | Role portals |
| `/help` · `/about` | Help centre, about |

Navigation goes through `go(route, param)` from `useApp()`, which wraps React Router's
`useNavigate` and carries the selected attraction. Deep links to `/detail` and `/booking`
without a selection fall back to the first attraction.

## Design tokens

Deep Ocean `#053A5E` · Ocean Light `#0A5C8F` · Turquoise `#12B0BC` / `#38D6DE` ·
Sea Green `#0E8F6F` · Sand `#FBF6EC` · Coral `#FF6B4A` (CTAs). Poppins for headings,
Inter for body. Tokens live in `src/styles/globals.css` and are mirrored in
`tailwind.config.js`, so new UI can be written with either the existing classes or
Tailwind utilities.

## Business rules encoded

Max 6 adults and 12 children per booking · nationality-based tariffs with 50% child
concession · 5% GST + ₹25 convenience fee · 15-minute cart hold · free cancellation up to
24 hours · slot capacity states Available / Limited / Fully Booked.

## Notes

All data is sample data in `src/services/data.jsx` and `src/services/api.jsx` returns it
behind simulated latency. Point `api.jsx` at the real backend and no component needs to
change.
