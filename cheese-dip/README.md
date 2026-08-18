# cheese-dip

cheese-dip is the frontend client for the meoww application, built with React, TypeScript, and Vite.

## Setup & Running

Make sure you have Node installed, then install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

The app runs on `http://localhost:5173` by default. It expects the `fried-chicken` backend to be running on `http://localhost:3000`. Vite is configured to automatically proxy API requests (`/api`) and socket connections to the backend.

### Environment Variables
- `VITE_API_URL` (optional): Set this to override the backend API URL. If not set, it defaults to the local development proxy.

## Testing

To run the Vitest test suite:
```bash
npm test
```

To run tests once for CI environments:
```bash
npm run test:ci
```

## Features
- Real-time P2P video chat using WebRTC
- Matchmaking via Socket.io
- Authentication with JWT, OTP, and Password Reset
- Account Settings and Profile Management
