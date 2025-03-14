export {};

declare global {
  interface Window {
    gtag: (type: string, action: string, params?: unknown) => void;
  }
}
