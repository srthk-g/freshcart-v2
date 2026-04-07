# FreshCart - Smart Grocery Delivery Web Application

A full-stack grocery delivery platform with real-time order tracking using a live map.

## Features

- 🛒 **Product Browsing** — Browse 22+ grocery products across 6 categories
- ✅ **Real-Time Stock** — See live stock availability before checkout
- 🛍️ **Smart Cart** — Add/remove items with quantity controls
- 💳 **Simulated Payment** — Demo checkout with order confirmation
- 📍 **Live Tracking** — Watch your delivery move in real-time on an interactive Leaflet.js map
- 👤 **User Auth** — Simple signup/login with session cookies
- 💬 **Customer Support** — Contact form with FAQ section

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18
- **Backend**: Next.js API Routes + Custom Server (Socket.IO)
- **Database**: SQLite (via sql.js)
- **Real-time**: Socket.IO
- **Map**: Leaflet.js + OpenStreetMap
- **Auth**: bcryptjs + HTTP-only cookies

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deploy to Render.com

1. Push this code to a GitHub repository
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Deploy!

The `render.yaml` file is included for automatic configuration.

## Project Structure

```
├── server.js              # Custom server with Socket.IO
├── lib/db.ts              # SQLite database layer
├── lib/socket.ts          # Socket.IO client
├── context/               # React contexts (Auth, Cart)
├── components/            # Shared components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   ├── OrderStatusBar.tsx
│   └── Map.tsx            # Leaflet map component
├── app/
│   ├── page.tsx           # Home/landing page
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── products/          # Product browsing
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout & payment
│   ├── orders/            # Order history
│   ├── tracking/[id]/     # Live delivery tracking
│   ├── support/           # Customer support
│   └── api/               # API routes
└── render.yaml            # Render.com config
```
