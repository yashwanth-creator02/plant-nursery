export type LeoLoaderTheme = "dark" | "light";

export interface LeoLoaderOptions {
  container: Element | string;
  theme?: LeoLoaderTheme;
  title?: string;
  subtitle?: string;
  lionSvg?: string;
  accentColor?: string;
  brandWeight?: number;
  reportEmail?: string;
  reportDelay?: number;
  reportSubject?: string;
  reportContext?: string;
  onReport?: (details: unknown) => void;
}

export default class LeoLoader {
  constructor(options: LeoLoaderOptions);
  static defaultLionSvg: string;
  setTheme(theme: LeoLoaderTheme): void;
  setAccent(accentColor?: string, brandWeight?: number): void;
  complete(): void;
  replay(): void;
  updateText(title?: string, subtitle?: string): void;
  getReportDetails(): unknown;
  buildReportHref(): string;
}
