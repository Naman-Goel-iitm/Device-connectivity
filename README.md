# Bolt - Real-time File and Text Transfer

A real-time file and text transfer application that allows users to share files and text between devices using WebSocket technology.

## Features

- Real-time file transfer between devices
- Text and link sharing
- Room-based connections
- Progress tracking for file transfers
- Copy to clipboard functionality
- Mobile-friendly interface

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + Socket.IO
- Styling: Tailwind CSS
- Icons: Lucide React

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd bolt
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

3. Create a `.env` file in the root directory:
```
VITE_BACKEND_URL=http://localhost:3001
```

4. Start the development servers:

```bash
# Start backend server
cd server
npm start

# In a new terminal, start frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## Deployment

The application is configured for deployment on Render.com. The `render.yaml` file contains the necessary configuration for both frontend and backend services.

## License

MIT 