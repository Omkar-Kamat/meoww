import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeProvider";
import ErrorBoundary from "./components/ErrorBoundary";

if (!import.meta.env.VITE_API_URL) {
  throw new Error("VITE_API_URL is not set. Check your .env file.");
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </ErrorBoundary>,
);
