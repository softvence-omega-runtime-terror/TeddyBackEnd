import express from 'express';
const app = express();
import cors from 'cors';
import globalErrorHandler from './middleware/globalErrorHandler';
import routeNotFound from './middleware/routeNotFound';
import Routes from './routes';
import paymentController from './modules/payment/payment.controller';
import { localeMiddleware } from './middleware/locale';
import autoTranslateMiddleware from './middleware/autoTranslate';

// Swagger imports
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger';


// Import the stripeWebhook controller
// Note: This route should be BEFORE express.json() middleware to get raw body
app.post("/api/webhook", express.raw({ type: "application/json" }), paymentController.stripeWebhook);

// middleWares
app.use(express.json());
// app.use(cors());
app.use(
  cors({
    origin: ['*', 'http://localhost:5173'],
    methods: 'GET,POST,PUT,PATCH,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  }),
);

app.get('/', (req, res) => {
  res.send('Welcome to Teddy server..!');
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TeddyBackEnd API Documentation'
}));

// JSON endpoint for API specs
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpecs);
});

// Middleware for locale/language detection (must come before auto-translate)
app.use(localeMiddleware);

// Auto-translate middleware (must come after locale middleware)
app.use(autoTranslateMiddleware);

// Routes
app.use('/api/v1', Routes);

// route not found
app.use(routeNotFound);

// global error handler
app.use(globalErrorHandler);

export default app;
