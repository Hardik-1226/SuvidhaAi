# 🏠 Local Service Finder — Hyperlocal Marketplace

A production-ready full-stack web application connecting users with trusted local service providers (plumbers, electricians, tutors, cleaners, and more) using AI-powered recommendations, real-time chat, and role-based dashboards.

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Maps | OpenStreetMap + Leaflet.js (free, no API key needed) |
| Real-time | Socket.io |
| AI Service | Python + FastAPI + scikit-learn |

---

## 📁 Project Structure

```
ServicesLocal/
├── backend/            # Node.js + Express API (port 5000)
│   ├── config/         # MongoDB connection
│   ├── controllers/    # Route logic (auth, services, bookings, reviews, providers, admin)
│   ├── middleware/     # JWT auth, error handler, role guard
│   ├── models/         # Mongoose schemas (User, Provider, Service, Booking, Review)
│   ├── routes/         # Express router files
│   ├── scripts/        # Database seed script
│   ├── socket/         # Socket.io chat handler
│   └── server.js       # Entry point
├── frontend/           # React + Tailwind (port 5173)
│   ├── src/
│   │   ├── components/ # Navbar, MapView, ServiceCard
│   │   ├── context/    # AuthContext, SocketContext
│   │   ├── pages/      # 9 pages (Home, Services, Booking, Chat, Dashboards...)
│   │   └── services/   # Axios API layer
│   └── index.html
└── ai-service/         # Python FastAPI (port 8000)
    ├── main.py         # FastAPI app
    ├── recommender.py  # Weighted scoring engine
    ├── fake_review_detector.py  # TF-IDF + Logistic Regression
    └── data/           # Sample CSV for ML training
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)

---

### 1️⃣ Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
copy .env.example .env
# Edit .env and set MONGO_URI if using Atlas

# Seed the database with sample data
npm run seed

# Start the backend server
npm run dev
```

**Server starts at:** `http://localhost:5000`

---

### 2️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

**App opens at:** `http://localhost:5173`

---

### 3️⃣ AI Microservice Setup

```bash
cd ai-service

# Create a virtual environment (recommended)
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python main.py
```

**AI service runs at:** `http://localhost:8000`
**Interactive docs:** `http://localhost:8000/docs`

> 💡 The ML model trains automatically on first startup using `data/sample_reviews.csv`

---

## 🔑 Demo Credentials (after running seed)

| Role | Email | Password |
|------|-------|----------|
| User | alice@example.com | password123 |
| Provider | raj@provider.com | password123 |
| Admin | admin@localservice.com | admin123 |

---

## 📡 API Reference

### Authentication

```bash
# Register as user
POST /api/auth/register
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "password123",
  "role": "user"
}

# Register as provider
POST /api/auth/register-provider
{
  "name": "Raj Kumar",
  "email": "raj@provider.com",
  "password": "password123",
  "category": "plumber",
  "pricePerHour": 300,
  "description": "Expert plumber with 10 years experience",
  "location": { "type": "Point", "coordinates": [77.209, 28.614] }
}

# Login
POST /api/auth/login
{ "email": "alice@example.com", "password": "password123" }
# → Returns: { token, user: { _id, name, email, role } }

# Get current user
GET /api/auth/me
Authorization: Bearer <token>
```

### Services

```bash
# Search services (with geospatial filter)
GET /api/services?category=plumber&lat=28.6139&lon=77.209&maxDistance=10000&sortBy=rating

# Get single service
GET /api/services/:id

# Create service (provider only)
POST /api/services
Authorization: Bearer <provider_token>
{
  "title": "Emergency Plumbing",
  "category": "plumber",
  "description": "24/7 pipes and leakage repair",
  "price": 350,
  "priceType": "hourly",
  "location": { "type": "Point", "coordinates": [77.209, 28.614] }
}
```

### Bookings

```bash
# Create booking
POST /api/bookings
Authorization: Bearer <user_token>
{
  "serviceId": "<service_id>",
  "scheduledAt": "2026-04-01T10:00:00Z",
  "duration": 2,
  "address": "123 Main St, Delhi",
  "notes": "Please bring extra tools",
  "paymentMethod": "cash"
}

# Get my bookings
GET /api/bookings/me
Authorization: Bearer <user_token>

# Update booking status (provider)
PATCH /api/bookings/:id
Authorization: Bearer <provider_token>
{ "status": "accepted" }   # or "rejected", "completed"
```

### AI-Powered Endpoints

```bash
# Get AI recommendations
GET /api/providers/recommend?lat=28.6139&lon=77.209&category=plumber
# → Returns top 5 ranked providers with AI scores

# Submit review (auto-checked by AI)
POST /api/reviews
Authorization: Bearer <user_token>
{
  "providerId": "<provider_id>",
  "bookingId": "<booking_id>",
  "rating": 5,
  "comment": "Excellent professional service!"
}
# → Returns review with aiLabel ("genuine"/"suspicious") and aiConfidence
```

### Admin

```bash
# Get platform stats
GET /api/admin/stats
Authorization: Bearer <admin_token>
# → { totalUsers, totalProviders, totalServices, totalBookings, totalRevenue }

# Toggle user status
PATCH /api/admin/users/:id/toggle
Authorization: Bearer <admin_token>

# Verify a provider
PATCH /api/admin/providers/:id/verify
Authorization: Bearer <admin_token>

# Remove spam listing
DELETE /api/admin/listings/:id
Authorization: Bearer <admin_token>
```

---

## 🤖 AI Microservice Endpoints

```bash
# POST /recommend
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "user_lat": 28.6139,
    "user_lon": 77.209,
    "category": "plumber",
    "providers": [
      {"id": "p1", "lat": 28.62, "lon": 77.21, "rating": 4.5, "isAvailable": true},
      {"id": "p2", "lat": 28.60, "lon": 77.20, "rating": 3.8, "isAvailable": true}
    ]
  }'
# Response: { "recommendations": [{"id": "p1", "score": 0.78}, {"id": "p2", "score": 0.61}] }

# POST /review-check
curl -X POST http://localhost:8000/review-check \
  -H "Content-Type: application/json" \
  -d '{"review": "AMAZING AMAZING AMAZING BEST SERVICE BEST BEST"}'
# Response: { "label": "suspicious", "confidence": 0.91 }
```

---

## 🔌 Real-time Chat

Socket.io events used by the frontend Chat page:

| Event (emit) | Payload | Description |
|---|---|---|
| `join_room` | `{bookingId, userId, userName}` | Join booking chat room |
| `send_message` | `{bookingId, senderId, senderName, message}` | Send a message |
| `typing` | `{bookingId, userName, isTyping}` | Typing indicator |
| `leave_room` | `{bookingId, userId, userName}` | Leave room |

| Event (listen) | Payload | Description |
|---|---|---|
| `receive_message` | `{senderId, senderName, message, timestamp}` | New message |
| `typing_indicator` | `{userName, isTyping}` | Is other user typing |
| `user_joined` | `{userId, userName}` | User joined notification |

---

## 🎨 Frontend Pages

| Route | Page | Access |
|-------|------|--------|
| `/` | Home (hero + map) | Public |
| `/services` | Service list + filters + AI picks | Public |
| `/book/:serviceId` | Booking form | Logged in |
| `/chat/:bookingId` | Real-time chat | Logged in |
| `/dashboard` | User dashboard + history | User |
| `/provider/dashboard` | Provider dashboard + earnings | Provider |
| `/admin` | Admin panel | Admin |

---

## 🤖 AI Scoring Formula

```
score = (rating × 0.4) + (proximity × 0.4) + (availability × 0.2)

where:
  rating      = provider_rating / 5.0
  proximity   = 1 / (1 + haversine_distance_km)
  availability = 1.0 if online, 0.0 if offline
```

Fake review detection uses **TF-IDF + Logistic Regression** with bigrams, trained on labeled sample data.

---

## 🔧 Configuration

All config via environment variables — copy `.env.example` to `.env` in each service directory.

| Variable | Service | Description |
|----------|---------|-------------|
| `MONGO_URI` | backend | MongoDB connection string |
| `JWT_SECRET` | backend | Secret key for JWT signing |
| `JWT_EXPIRE` | backend | Token expiry (e.g. `7d`) |
| `AI_SERVICE_URL` | backend | Python service base URL |
| `PORT` | backend | API server port (default: 5000) |
| `VITE_SOCKET_URL` | frontend | Socket.io server URL |

---

*Built with ❤️ — Local Service Finder v1.0*
