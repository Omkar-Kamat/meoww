import { Component } from "react";

const S = {
  page: "min-h-screen bg-[#080808] flex items-center justify-center p-6 relative overflow-hidden",
  orbTop:
    "absolute w-[600px] h-[600px] rounded-full blur-[110px] pointer-events-none bg-[rgba(0,229,255,0.045)] -top-[180px] left-1/2 -translate-x-1/2",
  orbBot:
    "absolute w-[300px] h-[300px] rounded-full blur-[110px] pointer-events-none bg-[rgba(0,229,255,0.025)] -bottom-[60px] -right-[60px]",
  card: "bg-white/[0.04] border border-white/[0.09] backdrop-blur-xl rounded-2xl p-[clamp(28px,5vw,40px)] w-full max-w-[420px] flex flex-col items-center gap-5 text-center relative z-10",
  brand: "font-bold text-[1.1rem] text-white tracking-[-0.03em]",
  eyebrow: "text-[0.65rem] tracking-[0.14em] uppercase text-red-400/80",
  h2: "font-bold text-[1.5rem] text-white tracking-[-0.03em] leading-tight",
  sub: "text-[0.85rem] text-white/50 leading-relaxed max-w-[320px]",
  btnRow: "flex gap-2.5 w-full flex-wrap",
  btnAcc:
    "flex-1 min-w-[120px] py-[11px] px-5 rounded-full border-none font-medium text-[0.88rem] cursor-pointer transition-all hover:shadow-[0_0_24px_rgba(0,229,255,0.3)]",
  btnGhost:
    "flex-1 min-w-[120px] py-[11px] px-5 rounded-full border border-white/[0.09] bg-white/[0.04] text-white font-medium text-[0.88rem] cursor-pointer transition-all hover:bg-white/[0.08] hover:border-white/20",
  pre: "w-full p-3 bg-white/[0.03] border border-white/[0.07] rounded-xl text-[0.7rem] text-left text-red-400/70 overflow-auto max-h-[120px] font-mono",
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }
  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className={S.page}>
        <div className={S.orbTop} />
        <div className={S.orbBot} />
        <div className={S.card}>
          <div className={S.brand} style={{ fontFamily: "'Syne', sans-serif" }}>
            Meoww
          </div>
          <div
            className={S.eyebrow}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Unexpected error
          </div>
          <h2 className={S.h2} style={{ fontFamily: "'Syne', sans-serif" }}>
            Something went wrong
          </h2>
          <p className={S.sub} style={{ fontFamily: "'DM Sans', sans-serif" }}>
            An unexpected error occurred. You can try again or return to the
            home page.
          </p>
          <div className={S.btnRow}>
            <button
              className={S.btnAcc}
              onClick={this.handleReset}
              style={{
                background: "var(--accent)",
                color: "#000",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Try Again
            </button>
            <button
              className={S.btnGhost}
              onClick={() => (window.location.href = "/")}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Go Home
            </button>
          </div>
          {import.meta.env.VITE_NODE_ENV !== "production" &&
            this.state.error && (
              <pre className={S.pre}>{this.state.error.toString()}</pre>
            )}
        </div>
      </div>
    );
  }
}
