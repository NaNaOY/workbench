/// <reference types="vite/client" />

interface Window {
  desktop?: {
    isDesktop: boolean;
    platform: string;
    persistStorage?: () => void;
    getStoragePath?: () => Promise<string>;
    onDailyUpdated?: (listener: () => void) => () => void;
  };
}
