import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "../shared/components/ErrorBoundary";
import { ToastContainer } from "../shared/components/ToastContainer";

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        {children}
      </BrowserRouter>
      <ToastContainer />
    </ErrorBoundary>
  );
};
