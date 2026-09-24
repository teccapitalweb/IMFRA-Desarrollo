export {};

declare global {
  interface Window {
    loadIMFRABookReader: () => Promise<void>;
  }
}

let loading: Promise<void> | null = null;

window.loadIMFRABookReader = () => {
  if (!loading) loading = import("./book-reader").then(() => undefined);
  return loading;
};

window.dispatchEvent(new CustomEvent("imfra:book-reader-loader-ready"));
