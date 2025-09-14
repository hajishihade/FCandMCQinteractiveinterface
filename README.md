# Flashcard Studying App

A modern flashcard studying application with spaced repetition, built with React and Node.js.

## Features

- ✨ Create and manage flashcard series
- 🎯 Smart filtering by subject, chapter, section, and tags
- 📊 Track study progress with detailed statistics
- 🔄 Session-based learning system
- 🎨 Beautiful, minimal UI design with purple gradient theme
- 📱 Responsive design for all devices

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- React Select for advanced filtering
- CSS3 with custom animations

### Backend
- Node.js with Express
- MongoDB with Mongoose
- RESTful API architecture

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/flashcardstudyingapp.git
cd flashcardstudyingapp
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Set up environment variables
Create a `.env` file in the backend directory:
```
MONGODB_URI=your_mongodb_connection_string
PORT=5001
```

4. Install frontend dependencies
```bash
cd ../frontend
npm install
```

5. Start the development servers

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

## Usage

1. **Create a Series**: Navigate to "Create Series" to build a new flashcard series
2. **Select Flashcards**: Use the advanced filtering system to find and select cards
3. **Study Sessions**: Work through flashcards in organized sessions
4. **Track Progress**: Monitor your learning with detailed statistics

## Project Structure

```
flashcardstudyingapp/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── middleware/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.