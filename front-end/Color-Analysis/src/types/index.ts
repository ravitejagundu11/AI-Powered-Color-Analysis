// types.ts
export type ViewState = 'home' | 'select' | 'camera' | 'preview' | 'processing' | 'result';

export interface IColor {
  name: string;
  hex: string;
  rgb?: number[] | null;
}
