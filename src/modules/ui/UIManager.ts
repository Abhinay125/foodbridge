import { ToastManager } from './ToastManager';
import { ModalManager } from './ModalManager';
import { LoadingManager } from './LoadingManager';

export class UIManager {
  private static instance: UIManager;
  public readonly toast: ToastManager;
  public readonly modal: ModalManager;
  public readonly loading: LoadingManager;

  private constructor() {
    this.toast = new ToastManager();
    this.modal = new ModalManager();
    this.loading = new LoadingManager();
  }

  static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  initialize(): void {
    this.toast.initialize();
    this.modal.initialize();
    this.loading.initialize();
  }
}