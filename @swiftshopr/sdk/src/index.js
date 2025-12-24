// @swiftshopr/sdk/src/index.js

// ============================================
// COMPONENTS
// ============================================
export { SwiftShoprProvider, useSwiftShoprConfig } from './components/SwiftShoprProvider';
export { default as PayWithUSDC } from './components/PayWithUSDC';
export { default as OnrampModal } from './components/OnrampModal';
export { default as BarcodeScanner } from './components/BarcodeScanner';
export { default as CartProvider } from './components/CartProvider';
export { default as ScanAndGoScreen } from './components/ScanAndGoScreen';

// ============================================
// HOOKS
// ============================================
export { useSwiftShoprWallet } from './hooks/useSwiftShoprWallet';
export { usePayment } from './hooks/usePayment';
export { useCart, useCartState, CartContext } from './hooks/useCart';

// ============================================
// CORE FUNCTIONS
// ============================================
// Config
export * from './core/config';

// Balance
export * from './core/balance';

// Transfers & Payment Intents
export * from './core/transfer';

// Onramp (Add Funds)
export * from './core/onramp';

// Payment Status
export * from './core/status';

// Branding
export * from './core/branding';

// Product Lookup (Scan & Go)
export * from './core/products';

// Receipts (Exit Verification)
export * from './core/receipts';
