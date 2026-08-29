import React from "react";

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "20px", textAlign: "center" }}>
                    <h2>Something went wrong.</h2>
                    <p style={{ color: "red" }}>{this.state.error?.message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ padding: "10px 20px" }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
