export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalOptions {
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  closable?: boolean;
  onClose?: () => void;
}

export interface ModalResult {
  confirmed: boolean;
  data?: unknown;
}

export interface LoadingOptions {
  message?: string;
  fullscreen?: boolean;
}