import { Section, Cell, Image, List } from '@telegram-apps/telegram-ui';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { Link } from '@/components/Link/Link.tsx';
import { Page } from '@/components/Page.tsx';

import tonSvg from './ton.svg';

export const IndexPage: FC = () => {
  const { t } = useTranslation();

  return (
    <Page back={false}>
      <div className="index-page__welcome">
        <h2>{t('welcome')}</h2>
        <p>{t('description')}</p>
      </div>
      <List>
        <Section
          header="MTYB Platform"
          footer="Virtual goods platform with plugin-based architecture"
        >
          <Link to="/products">
            <Cell subtitle="Browse digital goods and services">🛍️ Products</Cell>
          </Link>
          <Link to="/demo">
            <Cell subtitle="Explore the core infrastructure and components">🚀 Platform Demo</Cell>
          </Link>
        </Section>
        <Section
          header="Features"
          footer="You can use these pages to learn more about features, provided by Telegram Mini Apps and other useful projects"
        >
          <Link to="/ton-connect">
            <Cell
              before={<Image src={tonSvg} style={{ backgroundColor: '#007AFF' }} />}
              subtitle="Connect your TON wallet"
            >
              TON Connect
            </Cell>
          </Link>
        </Section>
        <Section
          header="Application Launch Data"
          footer="These pages help developer to learn more about current launch information"
        >
          <Link to="/init-data">
            <Cell subtitle="User data, chat information, technical data">Init Data</Cell>
          </Link>
          <Link to="/launch-params">
            <Cell subtitle="Platform identifier, Mini Apps version, etc.">Launch Parameters</Cell>
          </Link>
          <Link to="/theme-params">
            <Cell subtitle="Telegram application palette information">Theme Parameters</Cell>
          </Link>
        </Section>
      </List>

      <style>{`
        .index-page__welcome {
          text-align: center;
          padding: 2rem 1rem;
          background: var(--tg-theme-secondary-bg-color, #f8f9fa);
          margin-bottom: 1rem;
          border-radius: 12px;
        }

        .index-page__welcome h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: var(--tg-theme-text-color, #000);
        }

        .index-page__welcome p {
          font-size: 1rem;
          color: var(--tg-theme-hint-color, #666);
          margin: 0;
        }

        @media (max-width: 768px) {
          .index-page__welcome {
            padding: 1.5rem 1rem;
          }

          .index-page__welcome h2 {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </Page>
  );
};
