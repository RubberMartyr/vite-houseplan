declare class OffscreenCanvas extends EventTarget {
  constructor(width: number, height: number);
  width: number;
  height: number;
  getContext(contextId: string, options?: any): any;
}

declare interface OffscreenCanvasRenderingContext2D
  extends CanvasRenderingContext2D {}
