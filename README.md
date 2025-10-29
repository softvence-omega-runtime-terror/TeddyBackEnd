# Teddy - Personal Finance & Group Expense Management Platform

## 🚀 Project Overview

**Teddy** is a comprehensive financial management platform that empowers users to track personal income and expenses, manage group expenses with automated settlements, and gain actionable insights through advanced analytics. Built with scalability and user experience in mind, Teddy supports multi-currency transactions, recurring payments, and real-time notifications.

---

## 🎯 Key Features

### 💰 Personal Finance Management
- **Income & Expense Tracking**: Create, update, and delete income/expense records with custom categories
- **Multi-Currency Support**: Handle transactions in USD, EUR, SGD, GBP, and AUD with real-time exchange rates
- **Recurring Transactions**: Automate regular income/expenses with flexible scheduling (daily, weekly, monthly)
- **Custom Categories**: Create personalized income and expense categories with icon support
- **Advanced Analytics**: View financial insights with customizable date ranges, category breakdowns, and trend analysis

### 👥 Group Expense Management
- **Collaborative Groups**: Create and manage expense groups with multiple members
- **Flexible Split Options**: Equal or custom split distributions for group expenses
- **Smart Settlements**: Automated debt calculation using optimized greedy algorithms
- **Settlement History**: Track all past settlements with batch processing support
- **Group Analytics**: Comprehensive breakdowns by category and member contributions

### 💳 Subscription & Payments
- **Stripe Integration**: Secure payment processing for premium subscriptions
- **Multiple Plans**: Free tier and premium subscription options
- **Webhook Processing**: Automated subscription lifecycle management
- **Payment Verification**: Real-time payment status tracking

### 🌍 Internationalization
- **6 Languages**: English, Indonesian, Malay, Korean, Chinese, Japanese
- **Auto-Translation**: Google Translate API integration for seamless localization
- **Locale Middleware**: Automatic language detection from request headers

### 🔔 Real-time Features
- **WebSocket Notifications**: Instant updates for group transactions and settlements
- **Live Analytics**: Real-time financial data updates
- **JWT Authentication**: Secure WebSocket connections

### 📊 Analytics & Reporting
- **Dashboard Views**: Monthly and yearly financial overviews
- **Category Insights**: Spending patterns by category
- **Currency Normalization**: All analytics converted to user's preferred currency
- **Export-Ready Data**: Structured data for reporting and visualization

---

## 🛠️ Technology Stack

### Backend Framework
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe development

### Database
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB with schema validation

### Authentication & Security
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **Cookie Parser** - Cookie handling

### Payment Processing
- **Stripe API** - Payment gateway integration
- **Webhook Events** - Automated payment processing

### Real-time Communication
- **WebSocket (ws)** - Real-time bidirectional communication
- **JWT-based WS Auth** - Secure WebSocket connections

### Task Scheduling
- **Node-Cron** - Automated recurring transaction processing

### External Services
- **Google Translate API** - Multi-language support
- **Exchange Rate API** - Real-time currency conversion
- **SendGrid** - Email notifications
- **Cloudinary** - Image storage and management

### API Documentation
- **Swagger** - Interactive API documentation
- **swagger-jsdoc** - JSDoc-based Swagger generation
- **swagger-ui-express** - Swagger UI integration

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **ts-node-dev** - Development server with hot reload
- **Concurrently** - Run multiple commands

---

## 📁 Project Structure

```
TeddyBackEnd/
├── src/
│   ├── app.ts                          # Express app configuration
│   ├── server.ts                       # Server initialization & WebSocket setup
│   ├── config/
│   │   ├── index.ts                    # Environment configuration
│   │   └── swagger.ts                  # Swagger configuration
│   ├── constants/
│   │   └── index.ts                    # Application constants
│   ├── error/
│   │   ├── AppError.ts                 # Custom error classes
│   │   ├── duplicateError.ts           # Duplicate entry handler
│   │   ├── mongooseErrorHandler.ts     # MongoDB error handler
│   │   ├── NotFoundError.ts            # 404 error handler
│   │   └── zoodError.ts                # Zod validation errors
│   ├── i18n/
│   │   ├── i18nService.ts              # Internationalization service
│   │   └── locales/                    # Translation files (en, id, ja, ko, ms, zh)
│   ├── middleware/
│   │   ├── auth.ts                     # JWT authentication
│   │   ├── autoTranslate.ts            # Response translation
│   │   ├── globalErrorHandler.ts       # Error handling
│   │   ├── locale.ts                   # Language detection
│   │   ├── userPreferences.ts          # User preference middleware
│   │   └── validator.ts                # Request validation
│   ├── modules/
│   │   ├── auth/                       # Authentication module
│   │   ├── groupTransection/           # Group expense management
│   │   ├── history/                    # Transaction history
│   │   ├── incomeAndExpances/          # Personal finance management
│   │   ├── payment/                    # Stripe payment integration
│   │   ├── plan/                       # Subscription plans
│   │   ├── report/                     # Financial reports
│   │   ├── transection/                # Transaction management
│   │   ├── user/                       # User management
│   │   └── userSubscription/           # Subscription tracking
│   ├── routes/
│   │   └── index.ts                    # Route aggregation
│   ├── seeder/
│   │   └── adminSeeder.ts              # Database seeding
│   └── util/
│       ├── currencyConverter.ts        # Multi-currency support
│       ├── recurringScheduler.ts       # Cron job scheduler
│       ├── webSocket.ts                # WebSocket implementation
│       ├── googleTranslate.ts          # Translation utility
│       ├── emailSendBulkOrSingle.ts    # Email service
│       └── uploadImgToCloudinary.ts    # Image upload
├── docs/
│   └── addIncomeOrExpenses.examples.json   # API examples
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=your_mongodb_connection_string

# JWT Secrets
JWT_TOKEN_SECRET=your_jwt_secret
JWT_REFRESH_TOKEN_SECRET=your_refresh_token_secret
TOKEN_EXPIRES_IN=7d
REFRESH_EXPIRES_IN=30d
OTP_TOKEN_DURATION=10m

# Bcrypt
BCRYPT_SALT=10

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_SENDER_EMAIL=your_verified_sender_email

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Exchange Rate API
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
```

### Key API Endpoints

#### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Initiate password reset
- `POST /api/v1/auth/reset-password` - Reset password with token

#### Personal Finance
- `POST /api/v1/income-expense/add` - Add income/expense
- `GET /api/v1/income-expense/all` - Get all transactions
- `GET /api/v1/income-expense/filtered` - Get filtered transactions
- `PUT /api/v1/income-expense/:transactionId` - Update transaction
- `DELETE /api/v1/income-expense/:transactionId` - Delete transaction
- `POST /api/v1/income-expense/analytics` - Get analytics dashboard

#### Group Expenses
- `POST /api/v1/group-transaction/create` - Create expense group
- `POST /api/v1/group-transaction/addGroupExpense/:groupId` - Add group expense
- `GET /api/v1/group-transaction/groups` - Get all user groups
- `GET /api/v1/group-transaction/settlements/:groupId` - Get group settlements
- `POST /api/v1/group-transaction/settleDebt` - Settle individual debt
- `POST /api/v1/group-transaction/settleMultiple` - Settle multiple debts

#### Payments
- `POST /api/v1/payment/create-checkout` - Create Stripe checkout session
- `POST /api/webhook` - Stripe webhook handler
- `GET /api/v1/payment/verify` - Verify payment status

---

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt-based password encryption
- **CORS Protection**: Configured CORS policies
- **Input Validation**: Zod schema validation
- **Error Handling**: Comprehensive error handling with sanitized responses
- **Webhook Verification**: Stripe webhook signature verification
- **Rate Limiting**: Protection against abuse (recommended to implement)

---

## 🌟 Core Functionalities

### 1. Multi-Currency Support
- Real-time exchange rate fetching
- 1-hour rate caching for performance
- Fallback rates for offline scenarios
- Currency conversion for all analytics

### 2. Group Settlement Algorithm
- Optimized greedy algorithm for debt settlement
- Minimizes number of transactions required
- Handles complex multi-member scenarios
- Settlement history tracking

### 3. Recurring Transactions
- Cron-based automation (runs every minute)
- Flexible scheduling (minute, hour, day, week, month)
- Max occurrence limits
- End date support
- Automatic deactivation on completion

### 4. Real-time Notifications
- WebSocket-based instant updates
- JWT-authenticated connections
- Group transaction notifications
- Settlement alerts

---

## 📝 Available Scripts

```json
{
  "start": "node ./dist/server.js",                    // Production server
  "start:prod": "node ./dist/server.js",               // Production server
  "start:dev": "ts-node-dev --respawn --transpile-only ./src/server.ts",  // Development server
  "build": "npm install --include=dev && tsc",         // Build TypeScript
  "dev": "concurrently \"npx tsc --watch\" \"nodemon -q dist/server.js\"", // Watch mode
  "lint": "eslint src",                                 // Run linter
  "lint:fix": "npx eslint src --fix",                  // Fix linting issues
  "format": "prettier --ignore-path .gitignore --write \"./src/**/*.+(js|ts|json)\"" // Format code
}
```

## 🎨 Features in Detail

### Personal Finance Dashboard
- Track all income and expenses in one place
- Categorize transactions for better organization
- View spending patterns with visual analytics
- Filter by date range, category, or transaction type
- Multi-currency support with automatic conversion

### Group Expense Management
- Create unlimited groups (free tier: 2 groups)
- Add multiple members via email
- Split expenses equally or with custom amounts
- Track who paid and who owes
- Automated settlement suggestions
- Settlement history with batch tracking

### Smart Analytics
- Monthly and yearly financial overviews
- Category-wise spending breakdown
- Income vs. Expense comparisons
- Person-wise group expense analysis
- Exportable data for external analysis

### Subscription System
- Free tier with basic features
- Premium tier with unlimited groups
- Automated subscription management
- Stripe-powered secure payments
- Email notifications for subscription events

---

## 🔄 Recurring Transaction Flow

1. User creates a recurring transaction with schedule
2. System stores recurring configuration in database
3. Cron job runs every minute to check for due transactions
4. When due, system automatically creates transaction
5. Schedule updates with next run date
6. Process continues until max occurrences or end date

---

## 🌐 Internationalization Flow

1. Client sends request with `Accept-Language` header
2. Locale middleware detects preferred language
3. Auto-translate middleware processes response
4. Response returned in user's language
5. Supports 6 languages with Google Translate fallback

---

## 📊 Database Models

### User Model
- Authentication credentials
- Profile information
- Preferences (currency, language)
- Subscription status

### Transaction Model
- Income/Expense records
- Category references
- Recurring configuration
- Currency information

### Group Transaction Model
- Group details
- Member list
- Expense records with split details
- Settlement history

### Subscription Model
- Plan details
- Stripe customer information
- Subscription status
- Start/End dates

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.


## 🙏 Acknowledgments

- Stripe for payment processing
- Google Translate API for internationalization
- Exchange Rate API for currency conversion
- SendGrid for email services
- Cloudinary for media management
