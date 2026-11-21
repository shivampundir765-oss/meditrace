const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./swagger/swagger');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const notFoundHandler = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');
const v1Routes = require('./routes/v1');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL || '*',
  credentials: true
}));

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
app.use(env.API_PREFIX, apiLimiter);

// API Documentation (Swagger)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Meditrace API Docs'
}));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Root friendly redirect to API Docs
app.get('/', (req, res) => {
  res.redirect('/api/docs');
});

// API Routes
app.use(env.API_PREFIX, v1Routes);

// 404 and Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
