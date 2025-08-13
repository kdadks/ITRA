# ITR Assist

A comprehensive Income Tax Return filing and management platform built with React and Node.js.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Tax Return Management**: Create, calculate, and file ITR forms (ITR-1, ITR-2, ITR-3, ITR-4)
- **Document Management**: Upload and organize tax-related documents
- **Compliance Tracking**: Monitor tax deadlines and compliance requirements
- **Dashboard**: Overview of tax returns, compliance status, and key metrics
- **Admin Panel**: User management and system analytics
- **Mobile Responsive**: Works seamlessly across all devices

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- Express Validator for input validation
- Helmet for security headers
- Rate limiting and CORS protection

### Frontend
- React 18 with functional components
- Material-UI (MUI) for components
- React Router for navigation
- React Query for data fetching
- React Hook Form for form handling
- Recharts for data visualization
- Axios for API communication

## Project Structure

```
├── server/                 # Backend API
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── index.js           # Server entry point
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── App.js         # Main app component
│   └── public/            # Static assets
└── package.json           # Root package file
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd itr-assist
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   npm run install-server
   
   # Install client dependencies
   npm run install-client
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the server directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/itr-assist
   JWT_SECRET=your-super-secret-jwt-key
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the application**
   
   For development (runs both client and server):
   ```bash
   npm run dev
   ```
   
   Or run separately:
   ```bash
   # Start server (http://localhost:5000)
   npm run server
   
   # Start client (http://localhost:3000)
   npm run client
   ```

## 🚀 Deployment

### Automated Netlify Deployment

This project includes automated deployment to Netlify with GitHub Actions.

#### Quick Deploy to Netlify

1. **Fork/Clone this repository**
2. **Connect to Netlify:**
   - Sign up at [netlify.com](https://netlify.com)
   - Import your repository
   - Build settings are auto-configured via `netlify.toml`

3. **Environment Variables:**
   Set these in Netlify dashboard (Site Settings > Environment Variables):
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_API_URL=your_backend_api_url
   CI=false
   GENERATE_SOURCEMAP=false
   ```

4. **GitHub Secrets:**
   Add these to your GitHub repository (Settings > Secrets):
   ```
   NETLIFY_AUTH_TOKEN=your_netlify_auth_token
   NETLIFY_SITE_ID=your_netlify_site_id
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

#### Manual Deployment

```bash
# Build the client application
npm run build

# Deploy to Netlify
npm run deploy:netlify

# Or create a preview deployment
npm run deploy:preview
```

#### Deployment Features

- ✅ **Automatic deployments** on push to main branch
- ✅ **Preview deployments** for pull requests
- ✅ **Build optimization** with environment-specific configuration
- ✅ **Custom domain support** with SSL
- ✅ **Form handling** for contact forms
- ✅ **Redirect rules** for SPA routing

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Tax Returns
- `GET /api/tax/returns` - Get user's tax returns
- `POST /api/tax/returns` - Create new tax return
- `GET /api/tax/returns/:id` - Get specific tax return
- `PUT /api/tax/returns/:id/income` - Update income details
- `PUT /api/tax/returns/:id/deductions` - Update deductions
- `POST /api/tax/returns/:id/calculate` - Calculate tax
- `POST /api/tax/returns/:id/file` - File tax return

### Documents
- `POST /api/documents/upload/:returnId` - Upload document
- `GET /api/documents/:returnId` - Get documents for tax return
- `DELETE /api/documents/:returnId/:documentId` - Delete document

### Compliance
- `GET /api/compliance` - Get compliance items
- `POST /api/compliance` - Create compliance item
- `POST /api/compliance/:id/complete` - Mark as completed

### Admin (Admin role required)
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/tax-returns` - Get all tax returns

## Key Features Implementation

### Tax Calculation Engine
The platform includes a comprehensive tax calculation engine that:
- Supports different ITR forms (ITR-1, ITR-2, ITR-3, ITR-4)
- Calculates tax liability based on income slabs
- Handles various deductions (80C, 80D, 80G, etc.)
- Computes refunds and additional tax payable

### Document Management
- Secure file upload with validation
- Support for PDF, images, and Excel files
- File size limits and type restrictions
- Document categorization and tagging

### Compliance Tracking
- Automatic generation of compliance deadlines
- Penalty calculation for overdue items
- Reminder system for upcoming deadlines
- Progress tracking and status updates

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- Secure file uploads
- CORS protection

## Database Schema

### User Model
- Personal information (name, email, phone, PAN, Aadhar)
- Address details
- Subscription information
- User preferences and settings

### Tax Return Model
- Assessment year and financial year
- ITR form type
- Income details (salary, business, capital gains)
- Deductions and exemptions
- Tax computations
- Bank details
- Filing status and acknowledgment

### Compliance Model
- Compliance type and description
- Due dates and priorities
- Status tracking
- Penalty calculations

## Development Guidelines

### Code Style
- Use ES6+ features
- Follow React best practices with hooks
- Implement proper error handling
- Write clean, readable code with comments
- Use consistent naming conventions

### API Design
- RESTful endpoints
- Consistent response formats
- Proper HTTP status codes
- Input validation on all endpoints
- Authentication middleware where required

### Database
- Use Mongoose schemas with validation
- Implement proper indexing
- Handle database errors gracefully
- Use transactions for critical operations

## Testing

```bash
# Run server tests
cd server && npm test

# Run client tests
cd client && npm test
```

## Deployment

### Production Build
```bash
# Build client for production
npm run build

# Start production server
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=<production-mongodb-url>
JWT_SECRET=<secure-random-secret>
CLIENT_URL=<production-client-url>
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.

## Roadmap

### Phase 1 (Current)
- ✅ User authentication and profile management
- ✅ Basic tax return creation and calculation
- ✅ Document upload and management
- ✅ Compliance tracking
- ✅ Admin dashboard

### Phase 2 (Upcoming)
- [ ] Government API integration for e-filing
- [ ] Advanced tax calculations (new vs old regime)
- [ ] Bulk document processing
- [ ] Email notifications and reminders
- [ ] Multi-language support

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] AI-powered document analysis
- [ ] Integration with accounting software
- [ ] Professional tax consultant features
- [ ] Audit trail and compliance reports
