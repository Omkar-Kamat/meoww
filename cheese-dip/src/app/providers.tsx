import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "../shared/components/ErrorBoundary";

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </ErrorBoundary>
  );
};
