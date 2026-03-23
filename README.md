# Project Anon

Welcome to Project Anon! This repository is set up as a Yarn Workspace and contains the frontend (`mobile`) and the backend services (`backend`).

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### 1. Install Dependencies
From the root of the project, run Yarn to install all dependencies for both the mobile app and the backend:
```bash
yarn
```

### 2. Start the Backend
Open a new terminal, navigate to the backend directory, and start the local database and development server:
```bash
cd backend
yarn db:start
yarn dev
```

### 3. Start the Mobile App
Open another terminal, navigate to the mobile directory, and start the Expo development server:
```bash
cd mobile
yarn expo start
```
*Use the Expo Go app on your physical device or an emulator to scan the QR code and launch the app.*
