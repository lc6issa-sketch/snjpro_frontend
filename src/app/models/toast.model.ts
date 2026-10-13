export type ToastType = 'success' | 'error' | 'info';

export interface Toast { id: number; type: ToastType; message: string; }
