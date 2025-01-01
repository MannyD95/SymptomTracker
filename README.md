# MySymptomTracker

A web application for tracking and monitoring personal health symptoms over time, featuring a user-friendly dashboard with calendar integration and map visualization capabilities.

## Features

- User authentication (register/login)
- Interactive dashboard for symptom tracking
- Calendar-based symptom visualization
- Geographic symptom mapping using Leaflet.js
- Secure API with rate limiting
- Multi-environment support (development, test, production)

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Leaflet.js for map integration
- Node.js with http-server for development

### Backend
- Express.js RESTful API
- PostgreSQL database
- Sequelize ORM
- JWT authentication
- Express Rate Limiter for API protection

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/MySymptomTracker.git
cd MySymptomTracker
```

2. Install Backend Dependencies:
```bash
cd backend
npm install
```

3. Install Frontend Dependencies:
```bash
cd frontend
npm install
```

4. Configure Environment Variables:
- Copy `.env.test` to `.env`
- Update database credentials and other configuration as needed

5. Setup Database:
```bash
# Create development and test databases
createdb sniffly_dev
createdb sniffly_test
```

## Running the Application

### Development Mode

1. Start the Backend:
```bash
cd backend
npm start
```

2. Start the Frontend:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

## Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation
- Other environment-specific variables as defined in `.env.test`

## License

This project is licensed under the MIT License - see the LICENSE file for details. 