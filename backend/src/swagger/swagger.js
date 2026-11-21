const swaggerJsdoc = require('swagger-jsdoc');
const env = require('../config/env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Meditrace API Documentation',
      version: '1.0.0',
      description: 'Comprehensive REST API documentation for the Meditrace healthcare & medicine management platform.',
      contact: {
        name: 'Meditrace Engineering Team',
        email: 'support@meditrace.health'
      }
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token to authenticate.'
        }
      }
    }
  },
  apis: ['./src/routes/v1/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
