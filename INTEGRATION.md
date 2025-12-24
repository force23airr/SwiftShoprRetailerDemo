# SwiftShopr SDK Integration Guide

## Overview

This demo app shows how retailers integrate the `@swiftshopr/sdk` into their mobile apps for Scan & Go checkout with USDC payments.

**Key Point: Pick only what you need.** You don't have to use all components.

---

## Available Components

| Component | Purpose | Use When |
|-----------|---------|----------|
| `ScanAndGoScreen` | Complete checkout experience | You want the full scanner + cart + payment + receipt flow |
| `PayWithUSDC` | USDC payment button | You have your own cart, just need the payment button |
| `BarcodeScanner` | Camera barcode scanning | You want to integrate scanning into your custom UI |
| `OnrampModal` | "Add Funds" via Coinbase | You need standalone fund addition |
| `CartProvider` | Cart state management | You want SDK cart logic with custom UI |
| `SwiftShoprProvider` | Configuration wrapper | **Required for all SDK components** |

---

## Integration Examples

### Example 1: Full Experience (This Demo App)

Uses `ScanAndGoScreen` for the complete checkout flow:

```jsx
import { SwiftShoprProvider } from './@swiftshopr/sdk/src/components/SwiftShoprProvider';
import ScanAndGoScreen from './@swiftshopr/sdk/src/components/ScanAndGoScreen';

const config = {
  projectId: 'your-cdp-project-id',
  apiBaseUrl: 'https://shopr-scanner-backend.onrender.com',
  apiKey: 'sk_...',
  network: 'base',
  appName: 'Your Store',
};

function App() {
  return (
    <SwiftShoprProvider config={config}>
      <ScanAndGoScreen
        storeId="STORE001"
        storeName="Your Store"
        primaryColor="#CC0000"
        onComplete={(result) => console.log('Paid!', result)}
      />
    </SwiftShoprProvider>
  );
}
```

### Example 2: Just the Payment Button

If you already have your own cart UI, just drop in the payment button:

```jsx
import { SwiftShoprProvider, PayWithUSDC } from '@swiftshopr/sdk';

function YourCheckout({ cart, total }) {
  return (
    <SwiftShoprProvider config={config}>
      {/* Your existing cart UI */}
      <YourCartDisplay items={cart} />
      <YourTotalDisplay total={total} />

      {/* Just add the USDC payment button */}
      <PayWithUSDC
        amountUsd={total}
        storeId="STORE001"
        onSuccess={(result) => navigateToReceipt(result)}
      />
    </SwiftShoprProvider>
  );
}
```

### Example 3: Just the Scanner

If you want to handle everything else yourself:

```jsx
import { SwiftShoprProvider, BarcodeScanner } from '@swiftshopr/sdk';
import { lookupProduct } from '@swiftshopr/sdk/src/core/products';

function YourScanner() {
  const handleScan = async (barcode) => {
    const product = await lookupProduct({
      barcode,
      storeId: 'STORE001',
      apiBaseUrl: 'https://shopr-scanner-backend.onrender.com',
      apiKey: 'sk_...',
    });
    // Add to your own cart system
    yourCart.add(product);
  };

  return (
    <SwiftShoprProvider config={config}>
      <BarcodeScanner onScan={handleScan} primaryColor="#CC0000" />
    </SwiftShoprProvider>
  );
}
```

### Example 4: Core Functions Only (No Components)

Build 100% custom UI, just use SDK functions for API calls:

```jsx
import {
  lookupProduct,
  transferUSDC,
  openOnramp,
  generateReceipt,
} from '@swiftshopr/sdk';

const handlePayment = async () => {
  const result = await transferUSDC(storeWallet, amount, userWallet);
  const receipt = await generateReceipt({ intentId: result.intentId, ... });
};
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR MOBILE APP                                            │
│  (Integrates @swiftshopr/sdk components)                   │
│                                                             │
│  Customer: scans products → pays USDC → gets receipt       │
└─────────────────────────┬───────────────────────────────────┘
                          │ API calls
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  SWIFTSHOPR BACKEND                                         │
│  shopr-scanner-backend.onrender.com                         │
│                                                             │
│  • Product database                                         │
│  • Payment intent creation                                  │
│  • Blockchain monitoring                                    │
│  • Receipt generation                                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ WEBHOOK (payment.completed)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  YOUR BACKEND SERVER (optional)                             │
│  (Uses swiftshopr-payments for webhook verification)        │
│                                                             │
│  • Receives payment notifications                           │
│  • Updates POS system                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints Called by SDK

When SDK components are used, they call these endpoints:

| SDK Function/Component | Endpoint | Purpose |
|------------------------|----------|---------|
| `lookupProduct()` | `GET /api/v1/sdk/products/:barcode` | Get product info |
| `validateCart()` | `POST /api/v1/sdk/cart/validate` | Verify cart prices |
| `PayWithUSDC` | `POST /api/v1/payments/intents` | Create payment intent |
| `openOnramp()` | `POST /api/v1/sdk/onramp/session` | Create Coinbase session |
| `getPaymentStatus()` | `GET /api/v1/payments/:id/status` | Check payment status |
| `generateReceipt()` | `POST /api/v1/receipts` | Create e-receipt |
| `getReceipt()` | `GET /api/v1/receipts/:id` | Fetch receipt |

---

## Backend Webhook Integration (Optional)

If you need to update your POS system when payments complete, use `swiftshopr-payments` on your backend server:

```bash
npm install swiftshopr-payments
```

```js
// Your Node.js backend
const { createWebhooksHelper } = require('swiftshopr-payments/src/webhooks');

app.post('/webhooks/swiftshopr', express.raw({ type: 'application/json' }), (req, res) => {
  const webhooks = createWebhooksHelper(process.env.SWIFTSHOPR_WEBHOOK_SECRET);

  const event = webhooks.constructEvent(req.body, req.headers);

  if (event.type === 'payment.completed') {
    updatePOS({
      orderId: event.data.orderId,
      status: 'PAID',
      txHash: event.data.txHash,
    });
    unlockExitGate(event.data.orderId);
  }

  res.json({ received: true });
});
```

---

## Configuration

Required config for `SwiftShoprProvider`:

```js
const config = {
  // CDP Project ID from Coinbase Developer Platform
  projectId: 'your-cdp-project-id',

  // SwiftShopr Backend
  apiBaseUrl: 'https://shopr-scanner-backend.onrender.com',
  apiKey: 'sk_...', // Your retailer API key

  // Network: 'base' (mainnet) or 'base-sepolia' (testnet)
  network: 'base',

  // App name shown in wallet
  appName: 'Your Store Name',
};
```

---

## Requirements

### Dependencies

```json
{
  "dependencies": {
    "@coinbase/cdp-core": "^0.0.71",
    "@coinbase/cdp-hooks": "^0.0.71",
    "expo-camera": "~17.0.9",
    "expo-screen-capture": "~8.0.9",
    "expo-web-browser": "~15.0.9",
    "viem": "^2.42.0"
  }
}
```

### Metro Config

Add `metro.config.js` to block unused wallet connectors:

```js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const blockedModules = [
    '@base-org/account',
    '@gemini-wallet/core',
    '@walletconnect/ethereum-provider',
    '@safe-global/protocol-kit',
    '@safe-global/safe-apps-sdk',
    '@metamask/sdk',
    'porto',
  ];

  if (blockedModules.some(blocked =>
    moduleName === blocked || moduleName.startsWith(blocked + '/')
  )) {
    return { type: 'empty' };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
```

### Dev Build Required

The SDK uses native modules (camera, CDP wallet). You must use a development build:

```bash
# Install dev client
npx expo install expo-dev-client

# Build for iOS
eas build -p ios --profile development

# Build for Android
eas build -p android --profile development
```

---

## Summary

| What You Want | What to Use |
|---------------|-------------|
| Complete checkout experience | `ScanAndGoScreen` |
| Just payment button | `PayWithUSDC` |
| Just barcode scanning | `BarcodeScanner` |
| Just add funds | `OnrampModal` |
| Full custom UI | Core functions from `@swiftshopr/sdk/src/core/*` |
| Backend POS updates | `swiftshopr-payments` npm package |

**You don't need everything - just what fits your use case.**
