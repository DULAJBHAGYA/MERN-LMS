# MERN LMS (Learning Management System)

A full-stack Learning Management System built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring JWT role-based authentication and Docker containerization.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Student, Educator, Admin)
- Password hashing with bcrypt
- Email verification (optional)
- Password reset functionality

### 📚 Course Management
- Create, read, update, delete courses
- Course categories and difficulty levels
- Course publishing/unpublishing
- Course reviews and ratings
- Search and filtering capabilities

### 🎓 Learning Features
- Lesson management within courses
- Progress tracking
- Course enrollment
- Notes and annotations
- Certificate generation (planned)

### 👥 User Management
- Student and educator profiles
- User statistics and analytics
- Profile management
- Avatar upload support

### 🐳 DevOps
- Docker containerization
- Docker Compose for easy deployment
- Nginx reverse proxy
- MongoDB with persistent storage
- Health checks and monitoring

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **multer** - File uploads
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving
- **MongoDB** - Database container

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MERN-LMS
   ```

2. **Set up environment variables**
   ```bash
   cp server/env.example server/.env
   # Edit server/.env with your configuration
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

### Local Development

1. **Install dependencies**
   ```bash
   # Backend
   cd server
   npm install
   
   # Frontend
   cd ../client
   npm install
   ```

2. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update connection string in `server/.env`

3. **Start development servers**
   ```bash
   # Backend (from server directory)
   npm run dev
   
   # Frontend (from client directory)
   npm run dev
   ```

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Course Endpoints

#### Get All Courses
```http
GET /api/courses?page=1&limit=10&category=programming&level=beginner&search=javascript
```

#### Create Course (Educator only)
```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "JavaScript Fundamentals",
  "description": "Learn JavaScript from scratch",
  "category": "programming",
  "level": "beginner",
  "price": 49.99
}
```

#### Get Single Course
```http
GET /api/courses/:id
```

### Enrollment Endpoints

#### Enroll in Course
```http
POST /api/enrollments
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "course_id_here"
}
```

#### Get User Enrollments
```http
GET /api/enrollments/my-enrollments
Authorization: Bearer <token>
```

### Lesson Endpoints

#### Add Lesson to Course
```http
POST /api/lessons/:courseId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Introduction to Variables",
  "description": "Learn about variables in JavaScript",
  "content": "Variables are containers for storing data...",
  "order": 1,
  "duration": 15
}
```

## Environment Variables

### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mern-lms

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## Docker Commands

### Start all services
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f
```

### Stop all services
```bash
docker-compose down
```

### Rebuild containers
```bash
docker-compose up -d --build
```

### Access MongoDB shell
```bash
docker exec -it mern-lms-mongodb mongosh
```

## Project Structure

```
MERN-LMS/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   └── assets/        # Static assets
│   ├── Dockerfile         # Frontend Dockerfile
│   └── nginx.conf         # Nginx config for frontend
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   └── uploads/          # File uploads
├── Dockerfile            # Backend Dockerfile
├── docker-compose.yml    # Docker Compose configuration
├── nginx.conf           # Main nginx configuration
└── mongo-init.js        # MongoDB initialization script
```

## Required Modifications for Frontend

To integrate the frontend with the new backend, you'll need to:

1. **Update API calls**: Replace hardcoded data with API calls to the backend
2. **Add authentication**: Implement JWT token storage and management
3. **Add role-based routing**: Protect routes based on user roles
4. **Update forms**: Connect forms to backend endpoints
5. **Add error handling**: Implement proper error handling for API calls
6. **Add loading states**: Show loading indicators during API calls

### Example API Integration

```javascript
// services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
};

export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (courseData) => api.post('/courses', courseData),
  update: (id, courseData) => api.put(`/courses/${id}`, courseData),
  delete: (id) => api.delete(`/courses/${id}`),
};
```

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Input validation with express-validator
- CORS configuration
- Security headers with helmet
- Rate limiting
- SQL injection protection (MongoDB)
- XSS protection

## Performance Features

- MongoDB indexing for faster queries
- Gzip compression
- Static file caching
- Database connection pooling
- Rate limiting to prevent abuse

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

