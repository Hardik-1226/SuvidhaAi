const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from the standard path
dotenv.config();

const connectDB = require('../config/db');

async function clearAll() {
  try {
    await connectDB();
    console.log('Connected to MongoDB.');

    await require('../models/User').deleteMany({});
    await require('../models/Provider').deleteMany({});
    await require('../models/Service').deleteMany({});
    await require('../models/Review').deleteMany({});
    await require('../models/Booking').deleteMany({});
    await require('../models/Message').deleteMany({});

    console.log('✅ Database wiped completely of all dummy data.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clear database:', error);
    process.exit(1);
  }
}

clearAll();
