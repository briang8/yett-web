YETT Platform

A Full-Stack Learning and Mentorship Web Application

Overview

The YETT Platform provides learners with digital literacy modules, quizzes, progress tracking, and access to mentors. The project is built with a React frontend and a Node.js/Express backend.

This README explains how to run the project locally and how the deployment is structured when viewed on GitHub.

Project Structure
yett-platform/
│
├── backend/      Node.js API server (Express)
└── frontend/     React application (Vite)

Running the Project Locally
Prerequisites

Node.js 16+

npm

Backend Setup

Open a terminal and navigate to the backend folder:

cd backend


Install dependencies:

npm install


Create a .env file with:

PORT=5000
JWT_SECRET=your-secret


Start the backend:

npm start


The API will run at:
http://localhost:5000/api

Frontend Setup

Open another terminal and navigate to the frontend folder:

cd frontend


Install dependencies:

npm install


Create a .env file with:

VITE_API_URL=http://localhost:5000/api


Start the frontend:

npm run dev


The application will run at:
http://localhost:3000

Deployment Notes

The frontend can be deployed on GitHub Pages because it is static.

The backend cannot run on GitHub, so it must be hosted separately (Render, Railway, etc.).

When deployed, update the frontend .env value:

VITE_API_URL=https://your-backend-host.com/api

Default Admin Credentials

For testing purposes:

Email: admin@yett.com
Password: Admin123!

This is the only admin account. New users cannot register as admins for security purposes.

### Creating Test Accounts

To test the platform, you can register new accounts:

**For Learners**:
- Use the Sign Up page
- Select "Learner" as role
- Provide name, email, and password
- Password must be at least 8 characters with uppercase, lowercase, number, and special character

**For Mentors**:
- Use the Sign Up page
- Select "Mentor" as role
- Complete the registration form

### Testing Core Features

**As a Learner**:
- Login with learner credentials
- View available modules on the dashboard
- Complete modules by taking quizzes
- Request mentorship from available mentors
- Check progress tracking

**As a Mentor**:
- Login with mentor credentials
- View mentorship requests from learners
- Accept or decline requests
- View high-performing learners
- Send opportunity offers to learners

**As an Admin**:
- Login with admin credentials
- View all users and their progress
- Create new learning modules
- Delete existing modules
- Match mentors to mentees manually
- View platform statistics

## Application Features

### Authentication System
- Secure password-based authentication
- Password hashing with bcrypt
- JWT token-based session management
- Role-based access control (learner, mentor, admin)

### Learning Management
- Browse learning modules by difficulty level
- Take quizzes for each module
- Automatic progress tracking
- Quiz questions generated from course content
- Pass/fail system with score display

### Mentorship System
- Learners request mentorship from available mentors
- Mentors accept or decline requests
- Admin can manually match mentors to learners
- Mentors can send opportunity offers to high-performing learners
- Two-way communication system

### Admin Dashboard
- View all registered users
- Monitor learning progress across platform
- Manage learning modules
- Facilitate mentor-mentee matching
- Platform analytics and statistics

### User Interface
- Clean, professional dark green color scheme
- Fully responsive design (desktop, tablet, mobile)
- Intuitive navigation
- Loading states for async operations
- Toast notifications for user feedback
- Modal dialogs for confirmations
- Accessible forms with proper labeling

## Data Persistence

The application uses a file-based database (data.json) that stores:
- User accounts and profiles
- Learning modules and content
- Mentorship requests and matches
- Quiz questions and results
- Progress tracking data

This file is automatically created when you first start the backend server.

## Security Considerations

### Current Implementation
- Passwords are hashed using bcrypt before storage
- JWT tokens expire after 24 hours
- Admin registration is disabled
- Input validation on all forms

### For Production Use
Consider implementing:
- HTTPS/SSL certificates
- Rate limiting on API endpoints
- Email verification for new accounts
- Two-factor authentication
- Database migration to PostgreSQL or MongoDB
- Regular security audits
- Logging and monitoring systems

## Troubleshooting Common Issues

### Backend Issues

**Server won't start**:
- Verify Node.js is installed correctly
- Check if port 5000 is already in use
- Ensure all npm packages are installed
- Verify .env file exists and is configured

**Authentication errors**:
- Check JWT_SECRET is set in .env
- Verify passwords meet requirements
- Clear browser cookies and try again

### Frontend Issues

**Page won't load**:
- Ensure backend server is running
- Check VITE_API_URL in frontend .env
- Verify port 3000 is not in use
- Clear browser cache

**API connection errors**:
- Verify backend URL is correct
- Check browser console for CORS errors
- Ensure both servers are running

**Module not found errors**:
- Delete node_modules folder
- Run npm install again
- Check for typos in import statements

## Development Workflow

### Making Changes to Backend
- Edit files in backend directory
- Server automatically restarts with nodemon (if installed)
- Test API endpoints using browser or API client

### Making Changes to Frontend
- Edit files in frontend/src directory
- Vite hot-reloads changes automatically
- Check browser console for errors
- Test UI changes across different screen sizes

## File Locations

### Backend Files
All backend files are in the backend directory:
- server.js: Main server and API routes
- package.json: Dependencies and scripts
- .env: Environment variables
- data.json: Database (auto-generated)

### Frontend Files
All frontend files are in the frontend directory:
- src/: All React source code
- src/components/: React components
- src/utils/: Utility functions
- src/styles.css: Global styles
- index.html: Entry HTML file

## Module Content

The platform includes six pre-configured learning modules:
1. Basic Computer Skills (Beginner)
2. Internet and Online Safety (Beginner)
3. Introduction to Coding (Beginner)
4. Productivity Tools (Intermediate)
5. Career Readiness (Intermediate)
6. Build Your First Webpage (Intermediate)

Each module includes auto-generated quiz questions based on content.

## Stopping the Application

To stop the servers:
- Go to each terminal window running the servers
- Press Ctrl+C (or Cmd+C on Mac)
- Confirm shutdown if prompted

## Next Steps for Production

Before deploying to production:
1. Replace file-based database with PostgreSQL or MongoDB
2. Set up proper hosting (Railway, Render, Vercel, etc.)
3. Configure environment variables on hosting platform
4. Set up SSL certificates for HTTPS
5. Implement comprehensive logging
6. Add automated testing
7. Set up continuous integration/deployment
8. Configure backup systems
9. Implement monitoring and alerts
10. Review and harden security measures

## Getting Help

If you encounter issues:
- Check terminal output for error messages
- Review browser console for frontend errors
- Verify all files are created correctly
- Ensure environment variables are set
- Check that both servers are running
- Verify Node.js and npm versions
- Review this guide for missed steps

## Platform Capabilities Summary

**For Learners**: Access educational content, take quizzes, track progress, connect with mentors

**For Mentors**: Guide learners, manage requests, identify talent, offer opportunities

**For Admins**: Oversee platform, manage content, facilitate connections, monitor engagement

The platform is designed to be intuitive and user-friendly while providing comprehensive features for digital education and mentorship.