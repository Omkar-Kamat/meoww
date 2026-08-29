import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "../shared/components/ErrorBoundary";
import type { ReactNode } from "react";

export const AppProviders = ({ children }: { children: ReactNode }) => {
    return (
        <ErrorBoundary>
            <BrowserRouter>{children}</BrowserRouter>
        </ErrorBoundary>
    );
};
