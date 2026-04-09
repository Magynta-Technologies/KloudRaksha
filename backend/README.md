# KloudRaksha Backend

Node.js backend server for KloudRaksha, built with Express and MongoDB.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm or yarn
- Git

## Tech Stack

- Node.js with Express
- MongoDB with Mongoose
- JWT & Cookie Authentication
- Razorpay (Payment integration)
- Nodemailer (Email service)
- Multer (File uploads)
- Zod (Validation)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   PORT=8000
   MONGODB_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   COOKIE_SECRET=your_cookie_secret
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   RECAPTCHA_SITE_KEY=your_recaptcha_key
   RECAPTCHA_SITE_SECRET=your_recaptcha_secret
   API_URL=http://localhost:8000/api
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:8000`

## API Routes

### User Routes

- `POST /api/user/register` - Register new user
- `POST /api/user/login` - User login
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/update` - Update user profile

### Scan Routes

- `POST /api/scan/request` - Create new scan request
- `GET /api/scan/results` - Get scan results
- `GET /api/scan/history` - Get scan history

### Payment Routes

- `POST /api/payment/create` - Create payment
- `POST /api/payment/verify` - Verify payment
- `GET /api/payment/history` - Get payment history

### Admin Routes

- `GET /api/superadmin/users` - Get all users
- `PUT /api/superadmin/user/:id` - Update user role

## Project Structure

```
backend/
├── models/          # Database models
├── routes/          # API routes
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── config/         # Configuration files
├── db/             # Database connection
├── app.js          # Express app setup
└── index.js        # Entry point
```

## Database Models

- User
- ScanRequest
- Scanrequests
- AuditLog

## Error Handling

The application uses a centralized error handling mechanism. All errors are logged and appropriate HTTP status codes are sent to the client.

## Security Features

- JWT Authentication
- Password Hashing (bcrypt)
- CORS Protection
- Helmet Security Headers
- Rate Limiting
- Input Validation (Zod)

## Production Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

## Monitoring and Logging

- Morgan for HTTP request logging
- Debug module for development logging
- Error tracking and monitoring

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

