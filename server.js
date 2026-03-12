const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./config/database');

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not defined in environment variables');
  console.error('Please set JWT_SECRET in your .env file');
  console.error('Example: JWT_SECRET=your_super_secret_jwt_key_change_this_in_production');
  process.exit(1);
}

// Initialize models (import to set up associations)
require('./models');

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
// CORS configuration - allow frontend ports and local network IPs
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

// In development, also allow common local network origins (e.g. 192.168.x.x:3001)
const isLocalNetworkOrigin = (origin) => {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    return (
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    );
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== 'production' && isLocalNetworkOrigin(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Increase JSON/body size limit to allow photo uploads (guest photo + ID proof)
const BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || '10mb';
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

// Static file serving for uploads (e.g., logos)
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hotels', require('./routes/hotels'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/hotel-data', require('./routes/hotelData'));
app.use('/api/settings-dashboard', require('./routes/settingsDashboardRoutes'));
app.use('/api/multi-property', require('./routes/multiPropertyRoutes'));
app.use('/api/help-system', require('./routes/helpSystemRoutes'));
app.use('/api/user-guide', require('./routes/userGuideRoutes'));
app.use('/api/activity-logs', require('./routes/activityLogsRoutes'));
app.use('/api/support-tickets', require('./routes/supportTicketsRoutes'));
app.use('/api/backup', require('./routes/backupRoutes'));
app.use('/api/system-updates', require('./routes/systemUpdateRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Hotel Management API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

