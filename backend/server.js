/**
 * Main server entry point for SuvidhaAI API
 * Initializes Express, Socket.io, MongoDB connection, and all routes
 */

const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const initSocket = require('./socket/chat');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize chat socket events
initSocket(io);

// Inject IO into Express app for global controller access
app.set('io', io);

// -------- Middleware --------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// HTTP request logger in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// -------- API Routes --------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/weather', require('./routes/weatherRoutes'));

// Root route to welcome browser visitors
app.get('/', (req, res) => {
  res.send('🏠 SuvidhaAI API is running! Please access the frontend at http://localhost:5173');
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// -------- Centralized Error Handler --------
app.use(errorHandler);

// -------- Start Server --------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time connections`);
});
