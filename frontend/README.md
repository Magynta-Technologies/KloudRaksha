# KloudRaksha Frontend

A React-based frontend application for KloudRaksha, built with TypeScript and Vite.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

## Tech Stack

- React 18 with TypeScript
- Vite (Build tool)
- TailwindCSS (Styling)
- Material UI & Radix UI (Component libraries)
- React Router DOM (Routing)
- React Hook Form with Zod (Form handling & validation)
- Axios (HTTP client)
- Recharts (Data visualization)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   VITE_API_URL=http://localhost:8000
   VITE_SOCKET_URL=http://localhost:8000
   ```

4. **Start Development Server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The application will be available at `http://localhost:5173`

5. **Build for Production**
   ```bash
   npm run build
   # or
   yarn build
   ```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API services
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   ├── styles/        # Global styles
│   ├── App.tsx        # Root component
│   └── main.tsx       # Entry point
├── public/            # Static assets
└── index.html         # HTML template
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

