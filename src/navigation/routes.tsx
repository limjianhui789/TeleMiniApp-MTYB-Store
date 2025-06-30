import React, { Suspense, lazy } from 'react';
import type { ComponentType, JSX } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Lazy load all pages for better performance
const IndexPage = lazy(() => import('@/pages/IndexPage/IndexPage').then(m => ({ default: m.IndexPage })));
const InitDataPage = lazy(() => import('@/pages/InitDataPage.tsx').then(m => ({ default: m.InitDataPage })));
const LaunchParamsPage = lazy(() => import('@/pages/LaunchParamsPage.tsx').then(m => ({ default: m.LaunchParamsPage })));
const ThemeParamsPage = lazy(() => import('@/pages/ThemeParamsPage.tsx').then(m => ({ default: m.ThemeParamsPage })));
const TONConnectPage = lazy(() => import('@/pages/TONConnectPage/TONConnectPage').then(m => ({ default: m.TONConnectPage })));
const DemoPage = lazy(() => import('@/pages/DemoPage/DemoPage').then(m => ({ default: m.DemoPage })));
const ProductsPage = lazy(() => import('@/pages/ProductsPage/ProductsPage').then(m => ({ default: m.ProductsPage })));
const PaymentSuccessPage = lazy(() => import('@/pages/PaymentSuccessPage').then(m => ({ default: m.PaymentSuccessPage })));
const PaymentCancelPage = lazy(() => import('@/pages/PaymentCancelPage').then(m => ({ default: m.PaymentCancelPage })));
const OrderDetailPage = lazy(() => import('@/pages/OrderDetailPage').then(m => ({ default: m.OrderDetailPage })));
const CartPageEnhanced = lazy(() => import('@/pages/CartPage/CartPageEnhanced').then(m => ({ default: m.CartPageEnhanced })));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const PluginManagementPage = lazy(() => import('@/pages/PluginManagementPage').then(m => ({ default: m.PluginManagementPage })));
const PluginStorePage = lazy(() => import('@/pages/PluginStorePage').then(m => ({ default: m.PluginStorePage })));
const PluginPublishPage = lazy(() => import('@/pages/PluginPublishPage').then(m => ({ default: m.PluginPublishPage })));
const ThemeDemoPage = lazy(() => import('@/pages/ThemeDemoPage').then(m => ({ default: m.ThemeDemoPage })));
const ThemeSettingsPage = lazy(() => import('@/pages/ThemeSettingsPage').then(m => ({ default: m.ThemeSettingsPage })));

// Wrapper function to create suspense-wrapped components
const withSuspense = (Component: React.LazyExoticComponent<any>) => {
  const WrappedComponent: React.FC = (props) => (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <LoadingSpinner size="lg" />
      </div>
    }>
      <Component {...props} />
    </Suspense>
  );
  return WrappedComponent;
};

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: '/', Component: withSuspense(IndexPage) },
  { path: '/products', Component: withSuspense(ProductsPage), title: 'Products' },
  { path: '/products/:productId', Component: withSuspense(ProductDetailPage), title: 'Product Details' },
  { path: '/cart', Component: withSuspense(CartPageEnhanced), title: 'Shopping Cart' },
  { path: '/payment/success', Component: withSuspense(PaymentSuccessPage), title: 'Payment Success' },
  { path: '/payment/cancel', Component: withSuspense(PaymentCancelPage), title: 'Payment Cancelled' },
  { path: '/orders/:orderId', Component: withSuspense(OrderDetailPage), title: 'Order Details' },
  { path: '/plugins', Component: withSuspense(PluginStorePage), title: 'Plugin Store' },
  { path: '/plugins/manage', Component: withSuspense(PluginManagementPage), title: 'Plugin Management' },
  { path: '/plugins/publish', Component: withSuspense(PluginPublishPage), title: 'Publish Plugin' },
  { path: '/theme/demo', Component: withSuspense(ThemeDemoPage), title: 'Theme Demo' },
  { path: '/theme/settings', Component: withSuspense(ThemeSettingsPage), title: 'Theme Settings' },
  { path: '/demo', Component: withSuspense(DemoPage), title: 'Platform Demo' },
  { path: '/init-data', Component: withSuspense(InitDataPage), title: 'Init Data' },
  { path: '/theme-params', Component: withSuspense(ThemeParamsPage), title: 'Theme Params' },
  { path: '/launch-params', Component: withSuspense(LaunchParamsPage), title: 'Launch Params' },
  {
    path: '/ton-connect',
    Component: withSuspense(TONConnectPage),
    title: 'TON Connect',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 56 56"
        fill="none"
      >
        <path
          d="M28 56C43.464 56 56 43.464 56 28C56 12.536 43.464 0 28 0C12.536 0 0 12.536 0 28C0 43.464 12.536 56 28 56Z"
          fill="#0098EA"
        />
        <path
          d="M37.5603 15.6277H18.4386C14.9228 15.6277 12.6944 19.4202 14.4632 22.4861L26.2644 42.9409C27.0345 44.2765 28.9644 44.2765 29.7345 42.9409L41.5381 22.4861C43.3045 19.4251 41.0761 15.6277 37.5627 15.6277H37.5603ZM26.2548 36.8068L23.6847 31.8327L17.4833 20.7414C17.0742 20.0315 17.5795 19.1218 18.4362 19.1218H26.2524V36.8092L26.2548 36.8068ZM38.5108 20.739L32.3118 31.8351L29.7417 36.8068V19.1194H37.5579C38.4146 19.1194 38.9199 20.0291 38.5108 20.739Z"
          fill="white"
        />
      </svg>
    ),
  },
];
