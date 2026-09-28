const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');
const adminRoutes = require('./routes/adminRoutes');
const staffRoutes = require('./routes/staffRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { uploadsDir } = require('./middlewares/upload');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spillit';

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for dev / mobile / web
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'CARE (V1 Alpha) Campus Incident Command Backend',
    timestamp: new Date().toISOString(),
    allowed_domain: process.env.ALLOWED_DOMAIN || 'skcet.ac.in',
    mongo_connected: mongoose.connection.readyState === 1
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/ai', aiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.name || 'SERVER_ERROR',
    message: err.message || 'An internal server error occurred.'
  });
});

// Connect to MongoDB & Start Server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully at:', MONGO_URI);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 CARE Backend Server running on http://0.0.0.0:${PORT}`);
      console.log(`📡 Local Network IP: http://10.88.96.88:${PORT}`);
      console.log(`📸 Image uploads served from: http://localhost:${PORT}/uploads`);
      console.log(`🛡️ Institutional Domain: @${process.env.ALLOWED_DOMAIN || 'skcet.ac.in'}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });
