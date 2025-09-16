# Swagger API Documentation Setup

## 🎉 Swagger has been successfully integrated into your TeddyBackEnd project!

### 📍 **Access Your API Documentation:**

Once your server is running, you can access the interactive Swagger UI at:

```
http://localhost:8000/api-docs
```

### 🔧 **What's Been Implemented:**

1. **✅ Swagger Dependencies Installed:**
   - `swagger-jsdoc` - Generate Swagger specs from JSDoc comments
   - `swagger-ui-express` - Serve interactive Swagger UI
   - `@types/swagger-jsdoc` & `@types/swagger-ui-express` - TypeScript types

2. **✅ Swagger Configuration (`src/config/swagger.ts`):**
   - API info and descriptions
   - Server configurations (dev & production)
   - Comprehensive schemas for all data models
   - JWT authentication setup
   - Multi-language and multi-currency feature documentation

3. **✅ Swagger UI Integration (`src/app.ts`):**
   - Interactive documentation at `/api-docs`
   - JSON API specs at `/api-docs.json`
   - Custom styling and branding

4. **✅ API Documentation Added:**
   - **Authentication endpoints** - Login, logout, OTP verification, password management
   - **Group Transaction endpoints** - Create groups, manage expenses, track balances
   - Comprehensive request/response schemas
   - Authentication requirements clearly marked

### 🚀 **Features Highlighted in Documentation:**

- **Multi-language Support**: Automatic translation to user's preferred language
- **Multi-currency Support**: Real-time currency conversion with exchange rates
- **JWT Authentication**: Secure API access with role-based permissions
- **Group Financial Management**: Expense splitting and balance tracking
- **Error Handling**: Standardized error responses

### 📝 **How to Add More Documentation:**

To document additional endpoints, add JSDoc comments above your routes like this:

```typescript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   post:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [Your Tag]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field1:
 *                 type: string
 *               field2:
 *                 type: number
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/your-endpoint', authMiddleware, controller.yourMethod);
```

### 🧪 **Testing Features:**

The Swagger UI includes:
- **Try it out** buttons for testing endpoints directly
- **Authentication support** - Add your JWT token and test secured endpoints
- **Request/response examples** with real data structures
- **Schema validation** to ensure correct request formats

### 📊 **Key Endpoints Documented:**

#### Authentication (`/api/v1/auth/`)
- `POST /logIn` - User login with email/password or OAuth
- `POST /logOut` - User logout
- `POST /changePassword` - Password change
- `POST /otpCrossCheck` - OTP verification
- `GET /profile` - Get user profile

#### Group Transactions (`/api/v1/groupTransaction/`)
- `GET /getGroups` - Get user's groups with financial summaries
- `POST /createGroupTransaction` - Create new expense group
- `POST /addGroupExpense/{groupId}` - Add expense to group
- `GET /getGroupStatus/{groupId}` - Get financial status and balances

### 🌍 **Special Features Documented:**

1. **Currency Conversion**: All financial endpoints show how amounts are converted to user's preferred currency
2. **Language Translation**: API responses are automatically translated based on user preferences
3. **Error Handling**: Standardized error responses with proper HTTP status codes
4. **Authentication**: Clear indication of which endpoints require authentication

### 🔄 **Next Steps:**

1. **Start your server**: `npm run start:dev`
2. **Open Swagger UI**: Navigate to `http://localhost:8000/api-docs`
3. **Test authentication**: Use the login endpoint to get a JWT token
4. **Explore endpoints**: Try the group transaction endpoints with authentication
5. **Share with developers**: Send them the `/api-docs` link for easy API exploration

### 📚 **Additional Documentation:**

You can also access the raw OpenAPI JSON specification at:
```
http://localhost:8000/api-docs.json
```

This can be imported into other tools like Postman, Insomnia, or other API clients.

---

**Your API documentation is now ready for developers to explore and integrate with!** 🎯