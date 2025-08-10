import React from 'react';
import { Header } from './Header';
import type { HeaderProps } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  headerProps?: Partial<HeaderProps>;
}

export const Layout: React.FC<LayoutProps> = ({ children, headerProps }) => {
  return (
    <div className="app-layout">
      <Header {...headerProps} />
      <main className="app-layout__main">
        {children}
      </main>

      <style>{`
        .app-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-layout__main {
          flex: 1;
          padding-top: 0;
          background: var(--tg-theme-bg-color, #ffffff);
        }

        /* Ensure content doesn't get hidden behind sticky header */
        .app-layout__main > * {
          position: relative;
        }

        /* Dark theme adjustments */
        @media (prefers-color-scheme: dark) {
          .app-layout__main {
            background: var(--tg-theme-bg-color, #000000);
          }
        }
      `}</style>
    </div>
  );
}; 