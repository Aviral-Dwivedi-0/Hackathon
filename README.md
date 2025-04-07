# IntelliZEN  [![Live Demo](https://img.shields.io/badge/Live-Demo-green?style=for-the-badge)](https://ai-benchmark-frontend-1030334691721.us-central1.run.app/)


IntelliZen is an AI-powered code assistant that helps developers write better code faster. It combines the power of machine learning with intuitive user interface to provide real-time coding suggestions and improvements.

## 🚀 Features

- Real-time code suggestions
- Intelligent code completion
- Error detection and fixes
- Code refactoring suggestions
- Multi-language support
- Docker containerization
- React-based modern UI
- FastAPI backend for efficient processing

## 🛠️ Tech Stack

### Frontend

- React.js
- Tailwind CSS
- Node.js (v14+)
- npm/yarn

### Backend

- Python 3.11+
- FastAPI
- PyTorch
- Transformers

### Infrastructure

- Docker
- Docker Compose
- Git

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Python 3.11 or higher
- Node.js 14 or higher
- Docker and Docker Compose
- Git

## 🔧 Installation

### Clone the Repository

```bash
git clone https://github.com/Aviral-Dwivedi-0/IntelliZEN.git
cd IntelliZEN
```

### Backend Setup

1. Create and activate virtual environment:

   ```bash
   cd backend
   python -m venv venv

   # On Windows
   venv\Scripts\activate

   # On Unix or MacOS
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

## 🚀 Running the Application

### Using Docker (Recommended)

1. Build and start the containers:

   ```bash
   docker-compose up --build
   ```

   This will start both frontend and backend services.

2. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Setup

1. Start the backend server:

   ```bash
   cd backend
   python main.py
   ```

   The backend will be available at http://localhost:8000

2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```
   The frontend will be available at http://localhost:3000

## 📁 Project Structure

```
IntelliZen/
├── backend/
│   ├── main.py           # FastAPI application entry point
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── index.css     # Global styles
│   │   └── styles.css    # Component styles
│   └── package.json      # Node.js dependencies
├── docker/
│   ├── backend.Dockerfile  # Backend container configuration
│   └── frontend.Dockerfile # Frontend container configuration
└── docker-compose.yml    # Multi-container Docker configuration
```

## 🔑 Environment Variables

Create `.env` files in both frontend and backend directories:

### Backend (.env)

```
PORT=8000
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:8000
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🔄 API Endpoints

The backend provides the following API endpoints:

- `GET /health` - Health check endpoint
- `POST /analyze` - Code analysis endpoint
- `POST /suggest` - Code suggestion endpoint
- `GET /docs` - API documentation (Swagger UI)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Aviral Dwivedi - [GitHub](https://github.com/Aviral-Dwivedi-0)
- Siddhant Jaiswal -[GitHub](https://github.com/sddhantjaiii)
- Khushi Agarwal- [GitHub](https://github.com/agkhushi)
- Priyanka Katoch- [GitHub](https://github.com/priyankakatoch)
- Kartikey Karnwal- [GitHub](https://github.com/KartikeyKarnwal)

## 🙏 Acknowledgments

- OpenAI for AI models
- FastAPI team for the amazing framework
- React team for the frontend framework
- All contributors who helped with the project
