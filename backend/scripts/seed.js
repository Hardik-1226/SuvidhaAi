/**
 * Database Seed Script
 * Populates MongoDB with sample users, providers, services, and reviews
 * Run: node scripts/seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/local_service_finder';

const categories = ['plumber', 'electrician', 'carpenter', 'tutor', 'cleaner', 'painter'];

const sampleUsers = [
  { name: 'Alice Johnson', email: 'alice@example.com', password: 'password123', role: 'user', phone: '9876543210' },
  { name: 'Bob Smith', email: 'bob@example.com', password: 'password123', role: 'user', phone: '9876543211' },
  { name: 'Admin User', email: 'admin@localservice.com', password: 'admin123', role: 'admin', phone: '9876543299' },
];

const sampleProviders = [
  { name: 'Raj Kumar', email: 'raj@provider.com', password: 'password123', role: 'provider', phone: '9111111111', category: 'plumber', price: 300, description: '10 years experienced plumber for all types of work', lat: 28.6139, lon: 77.2090 },
  { name: 'Sunita Patel', email: 'sunita@provider.com', password: 'password123', role: 'provider', phone: '9222222222', category: 'electrician', price: 350, description: 'Certified electrician, 24×7 available', lat: 28.6200, lon: 77.2100 },
  { name: 'Mohan Das', email: 'mohan@provider.com', password: 'password123', role: 'provider', phone: '9333333333', category: 'tutor', price: 500, description: 'Math & Science tutor for classes 6-12', lat: 28.6100, lon: 77.2200 },
  { name: 'Priya Sharma', email: 'priya@provider.com', password: 'password123', role: 'provider', phone: '9444444444', category: 'cleaner', price: 250, description: 'Professional home cleaning services', lat: 28.6300, lon: 77.2150 },
  { name: 'Vikram Singh', email: 'vikram@provider.com', password: 'password123', role: 'provider', phone: '9555555555', category: 'carpenter', price: 400, description: 'Expert carpentry — furniture, repair, installation', lat: 28.6050, lon: 77.1980 },
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Drop collections entirely to remove stale indexes, then Mongoose recreates them
    await User.collection.drop().catch(() => {});
    await Provider.collection.drop().catch(() => {});
    await Service.collection.drop().catch(() => {});
    await Review.collection.drop().catch(() => {});
    // Recreate indexes (including the new sparse one on Review)
    await User.createIndexes();
    await Provider.createIndexes();
    await Service.createIndexes();
    await Review.createIndexes();
    console.log('🗑️  Cleared existing collections and rebuilt indexes');

    // Create regular users & admin
    const createdUsers = await User.create(sampleUsers);
    console.log(`👥 Created ${createdUsers.length} users`);

    // Create provider users + provider profiles
    const createdProviders = [];
    for (const p of sampleProviders) {
      const user = await User.create({
        name: p.name, email: p.email, password: p.password,
        role: 'provider', phone: p.phone,
      });
      const provider = await Provider.create({
        user: user._id,
        category: p.category,
        pricePerHour: p.price,
        description: p.description,
        experience: Math.floor(Math.random() * 10) + 2,
        location: { type: 'Point', coordinates: [p.lon, p.lat], address: 'Delhi, India', city: 'Delhi' },
        isAvailable: true,
        isVerified: true,
        ratings: { average: (Math.random() * 2 + 3).toFixed(1), count: Math.floor(Math.random() * 50) + 5 },
      });
      createdProviders.push(provider);

      // Create a service for each provider
      await Service.create({
        title: `${p.category.charAt(0).toUpperCase() + p.category.slice(1)} Service by ${p.name.split(' ')[0]}`,
        category: p.category,
        description: p.description,
        price: p.price,
        priceType: 'hourly',
        provider: provider._id,
        location: { type: 'Point', coordinates: [p.lon, p.lat], address: 'Delhi, India', city: 'Delhi' },
        isActive: true,
      });
    }
    console.log(`🔧 Created ${createdProviders.length} providers and services`);

    // Add sample reviews
    const reviewTexts = [
      { text: 'Excellent work! Very professional and on time.', rating: 5 },
      { text: 'Good service, would recommend.', rating: 4 },
      { text: 'Satisfied with the work done.', rating: 4 },
      { text: 'Very fast and efficient service!', rating: 5 },
      { text: 'Average experience, could be better.', rating: 3 },
    ];

    // Drop the user+booking index before inserting seed reviews
    // (the running backend may have recreated the old non-sparse version)
    await Review.collection.dropIndex('user_1_booking_1').catch(() => {});

    // Use different users for each review; no booking field = sparse index ignores it
    for (let i = 0; i < createdProviders.length; i++) {
      const r = reviewTexts[i % reviewTexts.length];
      const reviewer = createdUsers[i % createdUsers.length];
      await mongoose.connection.db.collection('reviews').insertOne({
        user: reviewer._id,
        provider: createdProviders[i]._id,
        rating: r.rating,
        comment: r.text,
        aiLabel: 'genuine',
        aiConfidence: 0.95,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log('⭐ Created sample reviews');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Sample Credentials:');
    console.log('  User: alice@example.com / password123');
    console.log('  Admin: admin@localservice.com / admin123');
    console.log('  Provider: raj@provider.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDB();
