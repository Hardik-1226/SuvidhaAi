# Suvidha AI — Hyperlocal Service Marketplace

> [!TIP]
> **View Full Project Documentation**: [DOCUMENTATION.md](file:///d:/ServicesLocal/DOCUMENTATION.md) — Comprehensive technical guide, AI logic, and architecture.

> Connecting users with trusted local service providers through AI-powered recommendations, real-time chat, and geospatial search.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=flat-square&logo=vercel)](https://suvidha-ai-git-main-hardik-1226s-projects.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=flat-square&logo=node.js)](/)
[![AI Service](https://img.shields.io/badge/AI%20Service-FastAPI%20%2B%20scikit--learn-blue?style=flat-square&logo=python)](/)

---

## What is Suvidha AI?

Suvidha AI is a full-stack hyperlocal marketplace where users can discover, book, and chat with nearby service providers — plumbers, electricians, tutors, cleaners, and more. An AI microservice ranks providers by proximity, rating, and availability, and also flags suspicious reviews using machine learning.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Maps | OpenStreetMap + Leaflet.js |
| Real-time | Socket.io |
| AI Service | Python + FastAPI + scikit-learn |

---

## Features

- **AI Recommendations** — Weighted scoring engine ranks providers by rating (40%), proximity (40%), and availability (20%)
- **Fake Review Detection** — TF-IDF + Logistic Regression model flags suspicious reviews with a confidence score
- **Geospatial Search** — Filter providers by location and distance using MongoDB `$geoNear`
- **Real-time Chat** — Socket.io-powered booking chat with typing indicators and room-based messaging
- **Role-based Dashboards** — Separate views for Users, Providers, and Admins
- **Map View** — Interactive Leaflet.js map showing nearby providers (no API key required)

---

## Project Structure

```
suvidha-ai/
├── backend/              # Node.js + Express API          → Port 5000
│   ├── config/           # MongoDB connection
│   ├── controllers/      # Route logic
│   ├── middleware/        # JWT auth, role guard, error handler
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routers
│   ├── scripts/          # Database seed script
│   ├── socket/           # Socket.io chat handler
│   └── server.js
│
├── frontend/             # React + Tailwind               → Port 5173
│   └── src/
│       ├── components/   # Navbar, MapView, ServiceCard
│       ├── context/      # AuthContext, SocketContext
│       ├── pages/        # Home, Services, Booking, Chat, Dashboards
│       └── services/     # Axios API layer
│
└── ai-service/           # Python FastAPI                 → Port 8000
    ├── main.py
    ├── recommender.py    # Weighted scoring engine
    ├── fake_review_detector.py
    └── data/             # Training CSV
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # Set MONGO_URI if using Atlas
npm run seed              # Seed sample data
npm run dev               # → http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev               # → http://localhost:5173
```

### 3. AI Microservice

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate     # Windows — use `source venv/bin/activate` on Mac/Linux
pip install -r requirements.txt
python main.py            # → http://localhost:8000
```

> The ML model trains automatically on first startup using `data/sample_reviews.csv`.

---

## Environment Variables

**backend/.env**

```
MONGO_URI=mongodb://localhost:27017/suvidha
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
AI_SERVICE_URL=http://localhost:8000
PORT=5000
```

**frontend/.env**

```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| User | alice@example.com | password123 |
| Provider | raj@provider.com | password123 |
| Admin | admin@localservice.com | admin123 |

---

## API Reference

### Auth

```
POST   /api/auth/register              Register as user
POST   /api/auth/register-provider     Register as provider
POST   /api/auth/login                 Login → returns JWT
GET    /api/auth/me                    Get current user
```

### Services

```
GET    /api/services                   Search with filters (category, lat, lon, maxDistance)
GET    /api/services/:id               Get single service
POST   /api/services                   Create service (provider only)
```

### Bookings

```
POST   /api/bookings                   Create booking
GET    /api/bookings/me                Get my bookings
PATCH  /api/bookings/:id               Update status (provider: accepted/rejected/completed)
```

### AI-Powered

```
GET    /api/providers/recommend        Top 5 AI-ranked providers (lat, lon, category)
POST   /api/reviews                    Submit review — auto-checked for authenticity
```

### Admin

```
GET    /api/admin/stats                Platform stats (users, bookings, revenue)
PATCH  /api/admin/users/:id/toggle     Ban/unban user
PATCH  /api/admin/providers/:id/verify Verify a provider
DELETE /api/admin/listings/:id         Remove spam listing
```

---

## AI Microservice

**Provider Recommendation Scoring**

```
score = (rating × 0.4) + (proximity × 0.4) + (availability × 0.2)

where:
  rating      = provider_rating / 5.0
  proximity   = 1 / (1 + haversine_distance_km)
  availability = 1.0 if online, else 0.0
```

**Fake Review Detection**

TF-IDF vectorization with bigrams + Logistic Regression, trained on labeled review data. Returns a label (`genuine` / `suspicious`) and a confidence score.

```bash
# Example
curl -X POST http://localhost:8000/review-check \
  -H "Content-Type: application/json" \
  -d '{"review": "AMAZING AMAZING AMAZING BEST SERVICE BEST BEST"}'

# → { "label": "suspicious", "confidence": 0.91 }
```

---

## Real-time Chat Events

| Event (emit) | Payload | Description |
|---|---|---|
| `join_room` | `{bookingId, userId, userName}` | Join a booking chat room |
| `send_message` | `{bookingId, senderId, senderName, message}` | Send a message |
| `typing` | `{bookingId, userName, isTyping}` | Typing indicator |
| `leave_room` | `{bookingId, userId, userName}` | Leave room |

| Event (listen) | Payload | Description |
|---|---|---|
| `receive_message` | `{senderId, senderName, message, timestamp}` | Incoming message |
| `typing_indicator` | `{userName, isTyping}` | Is the other user typing |
| `user_joined` | `{userId, userName}` | Join notification |

---

## Pages

| Route | Page | Access |
|---|---|---|
| `/` | Home — hero + map | Public |
| `/services` | Service list + filters + AI picks | Public |
| `/book/:serviceId` | Booking form | Logged in |
| `/chat/:bookingId` | Real-time chat | Logged in |
| `/dashboard` | User dashboard + history | User |
| `/provider/dashboard` | Provider dashboard + earnings | Provider |
| `/admin` | Admin panel | Admin |

---

## Author

**Hardik Varshney**
B.Tech CSE (AI/ML) — GL Bajaj Institute of Technology & Management

[![GitHub](https://img.shields.io/badge/GitHub-Hardik--1226-black?style=flat-square&logo=github)](https://github.com/Hardik-1226)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-hardik--varshney-blue?style=flat-square&logo=linkedin)](https://linkedin.com/in/hardik-varshney)
