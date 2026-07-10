// Minimal ambient typing for Electron's <webview> tag so TSX can use it directly.
// Electron injects the real DOM element/behavior at runtime inside the renderer;
// this file only describes the JSX attributes and the subset of the imperative
// API this app actually calls through refs.
import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        partition?: string;
        allowpopups?: string;
        useragent?: string;
        webpreferences?: string;
      };
    }
  }
}

export interface ElectronWebviewElement extends HTMLElement {
  src: string;
  loadURL(url: string): Promise<void>;
  reload(): void;
  stop(): void;
  goBack(): void;
  goForward(): void;
  canGoBack(): boolean;
  canGoForward(): boolean;
  getURL(): string;
  getTitle(): string;
  isLoading(): boolean;
}
