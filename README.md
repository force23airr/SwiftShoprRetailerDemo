# SwiftShopr Retailer Demo

A demo application showing how retailers can integrate the SwiftShopr Payments SDK into their mobile apps.

## What This Demonstrates

This demo app simulates a retailer's mobile checkout experience using the `swiftshopr-payments` npm package. It shows:

1. **Product Lookup** - Scan barcodes to look up products via the SDK
2. **Cart Management** - Add/remove items and calculate totals
3. **Payment Flow** - Create payment sessions via Coinbase onramp
4. **E-Receipts** - Generate and display digital receipts with verification codes

## Getting Started

```bash
# Install dependencies
npm install

# Start the app
npx expo start
```

## SDK Integration

```javascript
import { SwiftShoprClient } from 'swiftshopr-payments';

// Initialize with your API key
const client = new SwiftShoprClient({
  apiKey: 'sk_live_your_api_key',
  environment: 'production',
});

// Look up a product
const product = await client.products.lookup('123456789012');

// Create a payment session
const session = await client.payments.createSession({
  storeId: 'YOUR_STORE_ID',
  amount: 24.99,
});

// Create an e-receipt after payment
const receipt = await client.receipts.create({
  intentId: session.intentId,
  storeId: 'YOUR_STORE_ID',
  items: [...],
  total: 24.99,
});
```

## App Screens

### Cart Screen
- Enter barcodes manually or use quick-add buttons
- Products are looked up from the retailer's product database
- Automatic tax calculation (8%)
- "Pay with SwiftShopr" button initiates payment

### Payment Screen
- Shows amount due and payment intent ID
- In production, customer would complete payment via Coinbase
- Demo includes "Simulate Payment" button for testing

### Receipt Screen
- Large verification code for employee verification
- Item list with quantities and prices
- Payment confirmation with blockchain transaction hash
- 24-hour expiry for loss prevention

## Configuration

Update the demo store configuration in `App.js`:

```javascript
const DEMO_STORE = {
  id: 'YOUR_STORE_ID',
  name: 'Your Store Name',
  chainId: 'YOUR_CHAIN',
};
```

## For Retailers

To integrate SwiftShopr into your own app:

1. Sign up at [swiftshopr.com](https://swiftshopr.com)
2. Get your API key from the dashboard
3. Install the SDK: `npm install swiftshopr-payments`
4. Follow the integration guide in the SDK documentation

## License

MIT
