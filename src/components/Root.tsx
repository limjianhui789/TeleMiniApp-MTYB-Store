import { TonConnectUIProvider } from '@tonconnect/ui-react';

import { App } from '@/components/App.tsx';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { publicUrl } from '@/helpers/publicUrl.ts';

function ErrorBoundaryError({ error }: { error: unknown }) {
  return (
    <div>
      <p>An unhandled error occurred:</p>
      <blockquote>
        <code>
          {error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error)}
        </code>
      </blockquote>
    </div>
  );
}

export function Root() {
  return (
    <ErrorBoundary fallback={<ErrorBoundaryError error="An error occurred" />}>
      <TonConnectUIProvider manifestUrl={publicUrl('tonconnect-manifest.json')}>
        <App />
      </TonConnectUIProvider>
    </ErrorBoundary>
  );
}
