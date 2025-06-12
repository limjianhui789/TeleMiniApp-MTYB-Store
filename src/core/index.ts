// ============================================================================
// MTYB Virtual Goods Platform - Core System Exports
// ============================================================================

// Utilities (Available)
export * from './utils/Logger';
export * from './utils/EventEmitter';
export * from './utils/Validator';
export * from './utils/ConfigManager';

// Configuration
export * from './config/environment';

// Constants
export * from './constants';

// Plugin System (Phase 2 Implementation)
export * from './plugin/PluginManager';
export * from './plugin/PluginRegistry';
export * from './plugin/PluginEventEmitter';
export * from './plugin/PluginDevTools';

// Demo Plugins
export * from './plugin/plugins/DemoPlugin';

// Product Management (TODO: Implement in Phase 4)
// export * from './product/ProductManager';
// export * from './product/ProductService';

// Order Management (TODO: Implement in Phase 4)
// export * from './order/OrderManager';
// export * from './order/OrderService';

// Payment System (TODO: Implement in Phase 3)
// export * from './payment/PaymentGateway';
// export * from './payment/CurlecGateway';

// State Management (TODO: Implement in Phase 2)
// export * from './state/AppStateManager';
// export * from './state/StateStore';
