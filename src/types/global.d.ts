// ============================================================================
// MTYB Virtual Goods Platform - Global Type Declarations
// ============================================================================

// Telegram WebApp global interface
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
      };
    };
  }
}

export {};
