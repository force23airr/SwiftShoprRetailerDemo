# SwiftShopr SDK - API Reference

> Complete API documentation for @swiftshopr/sdk backend integration.

All endpoints require authentication via API key in the `x-swiftshopr-key` header.

**Base URL:** `https://api.swiftshopr.com/api/v1`

---

## Authentication

All requests require your API key:

```bash
curl https://api.swiftshopr.com/api/v1/sdk/products/012345678901 \
  -H "x-swiftshopr-key: pk_live_your_api_key"
```

**Get your API key:** [SwiftShopr Dashboard](https://dashboard.swiftshopr.com)

---

## Products

### Get Product by Barcode

Lookup product details by UPC/EAN barcode.

```http
GET /sdk/products/:barcode?storeId=STORE_ID
```

**Parameters:**
- `barcode` (path) - UPC or EAN barcode (e.g., `012345678901`)
- `storeId` (query) - Store identifier (required)

**Response:**
```json
{
  "product": {
    "barcode": "012345678901",
    "name": "Coca-Cola 12 Pack",
    "price": 6.99,
    "image_url": "https://...",
    "description": "12 oz cans, 12 pack",
    "category": "Beverages",
    "in_stock": true,
    "metadata": {}
  }
}
```

**Status Codes:**
- `200` - Product found
- `404` - Product not found
- `400` - Missing storeId
- `401` - Invalid API key

**Example:**
```javascript
import { lookupProduct } from '@swiftshopr/sdk';

const product = await lookupProduct({
  barcode: "012345678901",
  storeId: "STORE_1234",
  apiBaseUrl: "https://api.swiftshopr.com",
  apiKey: "pk_live_...",
});
```

---

### Validate Cart

Verify cart items and prices before checkout.

```http
POST /sdk/cart/validate
```

**Request Body:**
```json
{
  "storeId": "STORE_1234",
  "items": [
    {
      "barcode": "012345678901",
      "quantity": 2,
      "price": 6.99
    },
    {
      "barcode": "987654321098",
      "quantity": 1,
      "price": 4.29
    }
  ]
}
```

**Response:**
```json
{
  "valid": true,
  "subtotal": 18.27,
  "items": [
    { "barcode": "012345678901", "quantity": 2, "price": 6.99 },
    { "barcode": "987654321098", "quantity": 1, "price": 4.29 }
  ],
  "price_changes": [],
  "unavailable_items": []
}
```

**Price Changes:**
```json
{
  "price_changes": [
    {
      "barcode": "012345678901",
      "old_price": 6.99,
      "new_price": 7.49,
      "reason": "price_increase"
    }
  ]
}
```

**Status Codes:**
- `200` - Validation complete
- `400` - Invalid request
- `401` - Invalid API key

---

## Payments

### Create Transfer Intent

Create a payment intent before transferring USDC. This registers the payment with the backend for tracking and webhook dispatch.

```http
POST /sdk/onramp/transfer
```

**Request Body:**
```json
{
  "store_id": "STORE_1234",
  "amount": 42.99,
  "user_wallet_address": "0xCustomerWallet...",
  "order_id": "ORDER-456",
  "destination_address": "0xStoreWallet..."
}
```

**Response:**
```json
{
  "intent_id": "PI_abc123def456",
  "transfer": {
    "to": "0xStoreWallet...",
    "amount": "42990000",
    "asset": "USDC",
    "network": "base-mainnet"
  },
  "branding": {
    "store_name": "Target - Miami",
    "primary_color": "#CC0000",
    "logo_url": "https://..."
  }
}
```

**Status Codes:**
- `200` - Intent created
- `400` - Invalid request
- `401` - Invalid API key

**Example:**
```javascript
import { createTransferIntent } from '@swiftshopr/sdk';

const intent = await createTransferIntent({
  storeId: "STORE_1234",
  amount: 42.99,
  userWalletAddress: "0x...",
  destinationAddress: "0x...",
  apiBaseUrl: "https://api.swiftshopr.com",
  apiKey: "pk_live_...",
});

// Then transfer using the intent
await transferUSDC({
  to: intent.transfer.to,
  amount: intent.transfer.amount,
  // ...
});
```

---

### Get Payment Status

Check the status of a payment intent.

```http
GET /sdk/onramp/payments/:id/status?by=intent_id
```

**Parameters:**
- `id` (path) - Payment intent ID or transaction hash
- `by` (query) - Search by `intent_id` or `tx_hash` (default: `intent_id`)

**Response:**
```json
{
  "intent_id": "PI_abc123def456",
  "status": "completed",
  "tx_hash": "0x...",
  "amount": 42.99,
  "store_id": "STORE_1234",
  "order_id": "ORDER-456",
  "user_wallet": "0x...",
  "destination_wallet": "0x...",
  "created_at": "2025-12-23T15:30:00Z",
  "completed_at": "2025-12-23T15:30:15Z",
  "webhook_dispatched": true
}
```

**Status Values:**
- `pending` - Payment initiated
- `processing` - Transaction submitted to blockchain
- `completed` - Payment confirmed
- `failed` - Payment failed

**Status Codes:**
- `200` - Status retrieved
- `404` - Payment not found
- `401` - Invalid API key

**Example:**
```javascript
import { getPaymentStatus } from '@swiftshopr/sdk';

const status = await getPaymentStatus({
  id: "PI_abc123def456",
  by: "intent_id",
  apiBaseUrl: "https://api.swiftshopr.com",
  apiKey: "pk_live_...",
});
```

---

### Create Onramp Session

Create a Coinbase onramp session for users to add funds.

```http
POST /sdk/onramp/session
```

**Request Body:**
```json
{
  "store_id": "STORE_1234",
  "wallet_address": "0xCustomerWallet...",
  "amount_usd": 50.00,
  "order_id": "ORDER-789"
}
```

**Response:**
```json
{
  "onramp_url": "https://pay.coinbase.com/buy/select-asset?appId=...",
  "session_id": "session_abc123",
  "expires_at": "2025-12-23T16:30:00Z"
}
```

**Status Codes:**
- `200` - Session created
- `400` - Invalid request
- `401` - Invalid API key

---

## Receipts

### Generate Receipt

Create a digital receipt after successful payment.

```http
POST /sdk/receipts
```

**Request Body:**
```json
{
  "intent_id": "PI_abc123def456",
  "store_id": "STORE_1234",
  "order_id": "ORDER-456",
  "items": [
    {
      "barcode": "012345678901",
      "name": "Coca-Cola 12 Pack",
      "price": 6.99,
      "quantity": 2
    }
  ],
  "total": 13.98
}
```

**Response:**
```json
{
  "receipt_id": "RCP_xyz789abc123",
  "qr_data": "swiftshopr://verify/RCP_xyz789abc123",
  "qr_url": "https://api.swiftshopr.com/receipts/RCP_xyz789abc123/qr.png",
  "created_at": "2025-12-23T15:30:20Z",
  "expires_at": "2025-12-23T16:30:20Z",
  "items": [...],
  "total": 13.98,
  "store_id": "STORE_1234",
  "intent_id": "PI_abc123def456"
}
```

**Status Codes:**
- `200` - Receipt generated
- `400` - Invalid request
- `401` - Invalid API key

**Example:**
```javascript
import { generateReceipt } from '@swiftshopr/sdk';

const receipt = await generateReceipt({
  intentId: "PI_abc123def456",
  storeId: "STORE_1234",
  items: cartItems,
  total: 13.98,
  apiBaseUrl: "https://api.swiftshopr.com",
  apiKey: "pk_live_...",
});
```

---

### Get Receipt

Retrieve an existing receipt by ID.

```http
GET /sdk/receipts/:receiptId
```

**Parameters:**
- `receiptId` (path) - Receipt ID (e.g., `RCP_xyz789abc123`)

**Response:**
```json
{
  "receipt_id": "RCP_xyz789abc123",
  "qr_data": "swiftshopr://verify/RCP_xyz789abc123",
  "items": [...],
  "total": 13.98,
  "store_id": "STORE_1234",
  "intent_id": "PI_abc123def456",
  "status": "active",
  "created_at": "2025-12-23T15:30:20Z",
  "verified_at": null
}
```

**Status Values:**
- `active` - Receipt is valid
- `verified` - Receipt has been verified by employee
- `expired` - Receipt has expired

**Status Codes:**
- `200` - Receipt found
- `404` - Receipt not found
- `401` - Invalid API key

---

### Verify Receipt

Verify a receipt at exit gate (employee-facing).

```http
GET /sdk/receipts/:receiptId/verify
```

**Response:**
```json
{
  "valid": true,
  "receipt_id": "RCP_xyz789abc123",
  "items": [...],
  "total": 13.98,
  "store_id": "STORE_1234",
  "created_at": "2025-12-23T15:30:20Z",
  "age_minutes": 2
}
```

**Invalid Receipt:**
```json
{
  "valid": false,
  "reason": "expired",
  "message": "Receipt expired 45 minutes ago"
}
```

**Status Codes:**
- `200` - Verification complete
- `404` - Receipt not found
- `401` - Invalid API key

---

## Branding

### Get Store Branding

Retrieve store branding and theme configuration.

```http
GET /sdk/onramp/branding/:storeId
```

**Response:**
```json
{
  "store_id": "STORE_1234",
  "store_name": "Target - Miami Beach",
  "branding": {
    "primary_color": "#CC0000",
    "secondary_color": "#FFFFFF",
    "logo_url": "https://...",
    "banner_url": "https://..."
  }
}
```

**Status Codes:**
- `200` - Branding retrieved
- `404` - Store not found
- `401` - Invalid API key

---

## Configuration

### Get SDK Config

Retrieve retailer configuration (stores, wallets, settings).

```http
GET /sdk/config
```

**Response:**
```json
{
  "retailer_id": "RETAILER_001",
  "api_key": "pk_live_...",
  "stores": [
    {
      "store_id": "STORE_1234",
      "name": "Target - Miami Beach",
      "wallet_address": "0x...",
      "active": true
    }
  ],
  "settings": {
    "payment_currency": "USD",
    "network": "base-mainnet"
  }
}
```

**Status Codes:**
- `200` - Config retrieved
- `401` - Invalid API key

---

### Register Store

Register a new store location with wallet address.

```http
POST /sdk/config/stores
```

**Request Body:**
```json
{
  "store_id": "STORE_5678",
  "name": "Target - Fort Lauderdale",
  "wallet_address": "0xStoreWallet...",
  "location": {
    "address": "123 Main St",
    "city": "Fort Lauderdale",
    "state": "FL",
    "zip": "33301"
  }
}
```

**Response:**
```json
{
  "success": true,
  "store": {
    "store_id": "STORE_5678",
    "name": "Target - Fort Lauderdale",
    "wallet_address": "0xStoreWallet...",
    "active": true,
    "created_at": "2025-12-23T15:30:00Z"
  }
}
```

**Status Codes:**
- `201` - Store created
- `400` - Invalid request
- `401` - Invalid API key

---

## Analytics

### Get Dashboard Summary

Retrieve transaction analytics and summary.

```http
GET /sdk/dashboard/summary?period=7d
```

**Parameters:**
- `period` (query) - Time period (`24h`, `7d`, `30d`, `all`)

**Response:**
```json
{
  "total_transactions": 1234,
  "total_volume": 45678.90,
  "total_fees": 137.04,
  "average_transaction": 37.02,
  "stores": [
    {
      "store_id": "STORE_1234",
      "name": "Target - Miami",
      "transactions": 456,
      "volume": 16789.12
    }
  ],
  "period": "7d",
  "updated_at": "2025-12-23T15:30:00Z"
}
```

**Status Codes:**
- `200` - Summary retrieved
- `401` - Invalid API key

---

## Webhooks

SwiftShopr sends webhooks to your configured endpoint when events occur.

### payment.completed

Sent when a payment is successfully completed.

```json
{
  "event": "payment.completed",
  "intent_id": "PI_abc123def456",
  "store_id": "STORE_1234",
  "order_id": "ORDER-456",
  "amount": 42.99,
  "tx_hash": "0x...",
  "receipt_id": "RCP_xyz789abc123",
  "items": [...],
  "timestamp": "2025-12-23T15:30:15Z"
}
```

### receipt.generated

Sent when a digital receipt is created.

```json
{
  "event": "receipt.generated",
  "receipt_id": "RCP_xyz789abc123",
  "intent_id": "PI_abc123def456",
  "store_id": "STORE_1234",
  "items": [...],
  "total": 42.99,
  "qr_data": "swiftshopr://verify/RCP_xyz789abc123",
  "created_at": "2025-12-23T15:30:20Z"
}
```

### Webhook Verification

All webhooks include an `X-SwiftShopr-Signature` header for verification:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return `sha256=${hash}` === signature;
}

// In your webhook handler:
app.post('/webhooks/swiftshopr', (req, res) => {
  const signature = req.headers['x-swiftshopr-signature'];
  const isValid = verifyWebhook(req.body, signature, process.env.WEBHOOK_SECRET);

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Process webhook
  console.log('Payment completed:', req.body);
  res.status(200).send('OK');
});
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid parameters |
| `401` | Unauthorized - Invalid API key |
| `404` | Not Found - Resource doesn't exist |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error - Contact support |

**Error Response Format:**
```json
{
  "error": {
    "code": "invalid_barcode",
    "message": "Barcode must be 8-14 digits",
    "status": 400
  }
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Product Lookup | 100 req/min |
| Cart Validation | 50 req/min |
| Payment Intent | 30 req/min |
| Receipt Generation | 30 req/min |
| Dashboard | 10 req/min |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1703347200
```

---

## SDK Support

For questions about the SDK or API:

- **Email**: sdk-support@swiftshopr.com
- **Documentation**: https://docs.swiftshopr.com
- **Status**: https://status.swiftshopr.com
- **Dashboard**: https://dashboard.swiftshopr.com
