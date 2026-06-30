require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { initScheduler } = require('./services/scheduler');

const app = express();

// Connect Database
connectDB();

// 1. CORS configuration (Must be first to handle preflight OPTIONS requests)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin requests or clients like curl/mobile apps with no origin header
    if (!origin) return callback(null, true);
    
    // Allow localhost, configured FRONTEND_URL, Google Cloud Run, or Firebase domains
    if (
      origin.endsWith('.run.app') || 
      origin.endsWith('.web.app') || 
      origin.endsWith('.firebaseapp.com') || 
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// 2. Helmet security headers (disable default CSP to prevent blocking React inline styles/scripts)
app.use(helmet({
  contentSecurityPolicy: false,
}));

// 3. Morgan logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// 4. Rate limiting for all /api routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// 5. Body parser with limit
app.use(express.json({ limit: '10kb' }));

// 6. URL encoding parser
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend static assets in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('/{*splat}', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// 404 Catch-all handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
  });
});

// Mount errorHandler LAST
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log(`🚀 DeadlineAI server running on port ${PORT} [${NODE_ENV}]`);
  initScheduler();
});
