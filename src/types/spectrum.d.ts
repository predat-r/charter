
import type { JSX } from 'preact';

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'sp-theme': JSX.HTMLAttributes<HTMLElement> & {
        system?: string;
        color?: 'light' | 'dark';
        scale?: 'medium' | 'large';
      };

      'sp-picker': JSX.HTMLAttributes<HTMLElement> & {
        label?: string;
        value?: string;
        quiet?: boolean;
        size?: 's' | 'm' | 'l' | 'xl';
      };

      'sp-menu-item': JSX.HTMLAttributes<HTMLElement> & {
        value?: string;
        disabled?: boolean;
      };
    }
  }
}
