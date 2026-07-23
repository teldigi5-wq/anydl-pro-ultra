import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Catch uncaught errors and unhandled promise rejections that happen outside
// React's render cycle (e.g. in event handlers or async code) — these don't
// trigger the Error Boundary, but were previously invisible failures.
window.addEventListener('error', (event) => {
  console.error('[global] Uncaught error:', event.error);
  (window as any).anydl?.logRendererError?.(String(event.error?.stack || event.message));
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[global] Unhandled promise rejection:', event.reason);
  (window as any).anydl?.logRendererError?.(String(event.reason?.stack || event.reason));
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
