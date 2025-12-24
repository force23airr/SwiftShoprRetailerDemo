# SwiftShopr Demo Guide

> How to demo the complete Scan & Go payment system to retailers.

---

## Demo Audiences

| Audience | Focus | Duration |
|----------|-------|----------|
| **Executives** (CEO, CFO) | ROI, fees, settlement speed | 15 min |
| **Product/Operations** (VP Product, Store Ops) | Customer experience, employee workflow | 20 min |
| **Engineering** (CTO, Dev Lead) | Integration effort, API, SDK | 30 min |

---

## Executive Demo (15 Minutes)

### Setup
- iPad/iPhone with SwiftShopr app loaded
- Sample products with barcodes
- Projector/screen showing: dashboard with fake transactions

### Script

**1. The Problem (2 min)**
> "Retailers lose 2.5-3.5% on every credit card transaction. For a $10M/year store, that's $250K-$350K in fees. Plus, you wait 2-3 days for settlement and deal with chargebacks."

**Show slide:** Credit card fees vs SwiftShopr

| Payment Method | Fee | Settlement | Chargebacks |
|----------------|-----|------------|-------------|
| Credit Card | 2.5-3.5% | 2-3 days | Yes |
| SwiftShopr | 0.3% | Instant | No |

**2. The Solution (3 min)**
> "SwiftShopr lets your customers scan and pay with USDC stablecoins. 90% lower fees, instant settlement, no chargebacks."

**Live Demo:**
1. Open app → Tap "Scan & Pay"
2. Scan Coca-Cola → $1.99 added
3. Scan Doritos → $4.29 added
4. Review cart: $6.28 total
5. Tap "Pay with USDC"
6. **Payment completes in 3 seconds**
7. Receipt appears (show verification code)

> "Customer just paid $6.28. You received $6.26 instantly. You saved 97% on fees."

**3. The ROI (5 min)**

**Show slide:** Projected savings

```
Current Annual Revenue: $10,000,000
Credit Card Fees (3%):  -$300,000
With SwiftShopr (0.3%): -$30,000
─────────────────────────────────
Annual Savings:         $270,000
```

> "Even with conservative 5% adoption, you save $13,500/year per store. 50 stores = $675K saved."

**4. Customer Experience (3 min)**

Show receipt on screen:
- Verification code: A7B3C9D2
- Timestamp: 2 minutes ago
- Items: Coca-Cola, Doritos
- Total: $6.28

> "Customer shows this to any employee at exit. Employee confirms code and timestamp. No special hardware needed. Increases customer convenience, reduces checkout lines."

**5. Integration (2 min)**

> "Your dev team integrates our SDK in 1-2 days. We handle the entire payment stack. You just drop a component into your existing app."

**Show slide:**
```jsx
<ScanAndGoScreen
  storeId="PUBLIX_001"
  onComplete={(result) => {
    // Payment done
  }}
/>
```

> "That's it. Complete Scan & Go checkout in 3 lines of code."

---

## Product/Operations Demo (20 Minutes)

### Setup
- iPhone with SwiftShopr app
- 5-10 sample products with real barcodes
- Second device (employee phone) for verification demo

### Script

**1. Customer Journey (10 min)**

Walk through the complete flow:

```
Customer enters store
        ↓
Opens Publix app → Taps "Scan & Pay"
        ↓
Scans items as they shop (show scanning 5 products)
        ↓
Reviews cart, sees total
        ↓
Taps "Pay with USDC" → Adds funds if needed
        ↓
Payment completes → Receipt appears
        ↓
Walks to exit, shows phone to employee
        ↓
Employee verifies → Customer leaves
```

**Highlight:**
- Fast scanning (scan every 2 seconds)
- Real-time cart updates
- Instant payment (3-5 seconds)
- Screenshot-protected receipt

**2. Employee Verification (5 min)**

> "Employees don't need special training or hardware. They just look at the customer's phone and verify:"

**Show receipt on customer phone:**
```
✓ Payment Complete

VERIFICATION CODE
A7B3C9D2

Dec 23, 2025 • 3:45 PM

📍 Publix - Miami Beach

── ITEMS PURCHASED ──
Coca-Cola 12 Pack    $6.99
Doritos Nacho        $4.29

Total Paid          $11.28
Paid with USDC
```

**Employee checks:**
1. Code is visible (not a screenshot)
2. Timestamp is recent (within 15 mins)
3. Items match what's in bag

> "Takes 5 seconds. No scanning, no receipt printer, no extra devices."

**3. Fraud Prevention (3 min)**

**Try to screenshot the receipt:**
- iOS: Screenshot is black
- Android: Screenshot blocked

> "Customers must show the live app. Old screenshots don't work. Receipts expire after 15 minutes."

**4. Store Operations Impact (2 min)**

Benefits:
- Reduced checkout congestion
- Faster customer throughput
- No receipt paper/printers for Scan & Go
- Employees free to assist vs cashier
- Real-time inventory tracking
- Lower shrink (all items scanned)

---

## Engineering Demo (30 Minutes)

### Setup
- Laptop with code editor
- SwiftShopr SDK repository open
- Terminal with API testing (curl/Postman)
- Projector showing code

### Script

**1. Architecture Overview (5 min)**

**Show diagram:**
```
┌──────────────────────────┐
│   RETAILER'S APP         │
│   (Your existing app)     │
│                          │
│   + @swiftshopr/sdk      │
│     (drop-in component)   │
└──────────┬───────────────┘
           │
           ↓
┌──────────────────────────┐
│   SwiftShopr Backend     │
│   (Render - 99.9% uptime)│
│                          │
│   /sdk/products          │
│   /sdk/payments          │
│   /sdk/receipts          │
└──────────┬───────────────┘
           │
           ↓
┌──────────────────────────┐
│   Base Blockchain (L2)   │
│   USDC Transfers         │
└──────────────────────────┘
```

> "You integrate our SDK. We handle blockchain, payments, receipts. Your backend gets webhooks."

**2. Integration Demo - Live Coding (15 min)**

**Step 1: Install SDK (2 min)**
```bash
npm install @swiftshopr/sdk expo-camera expo-screen-capture
```

**Step 2: Wrap App (3 min)**

Open `App.js`:
```jsx
import { SwiftShoprProvider } from '@swiftshopr/sdk';

export default function App() {
  return (
    <SwiftShoprProvider
      apiKey="pk_live_demo_key"
      apiBaseUrl="https://api.swiftshopr.com"
    >
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ScanAndGo" component={ScanAndGoScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SwiftShoprProvider>
  );
}
```

**Step 3: Create Scan & Go Screen (5 min)**

Create `screens/ScanAndGoScreen.js`:
```jsx
import { ScanAndGoScreen } from '@swiftshopr/sdk';

export default function PublixScanAndGo({ navigation }) {
  return (
    <ScanAndGoScreen
      storeId="PUBLIX_MIAMI_001"
      storeName="Publix - Miami Beach"
      primaryColor="#378B29"  // Publix green
      onComplete={(result) => {
        console.log('Payment:', result);
        // Update loyalty points
        // Log to analytics
        navigation.navigate('Home');
      }}
    />
  );
}
```

**Step 4: Add Button to Home (2 min)**

```jsx
function HomeScreen({ navigation }) {
  return (
    <TouchableOpacity onPress={() => navigation.navigate('ScanAndGo')}>
      <Text>Scan & Pay</Text>
    </TouchableOpacity>
  );
}
```

**Step 5: Run App (3 min)**

```bash
npm start
# Open on iOS/Android
# Tap "Scan & Pay"
# Demo the full flow
```

> "That's the entire integration. 30 lines of code, 2 hours of work."

**3. API Demo (5 min)**

**Show Postman/curl:**

**Lookup Product:**
```bash
curl https://api.swiftshopr.com/api/v1/sdk/products/012345678901?storeId=PUBLIX_001 \
  -H "x-swiftshopr-key: pk_live_demo"

# Returns:
{
  "product": {
    "barcode": "012345678901",
    "name": "Coca-Cola 12 Pack",
    "price": 6.99,
    "in_stock": true
  }
}
```

**Create Payment Intent:**
```bash
curl -X POST https://api.swiftshopr.com/api/v1/sdk/onramp/transfer \
  -H "x-swiftshopr-key: pk_live_demo" \
  -d '{
    "store_id": "PUBLIX_001",
    "amount": 42.99,
    "user_wallet_address": "0x..."
  }'

# Returns:
{
  "intent_id": "PI_abc123",
  "transfer": { "to": "0x...", "amount": "42990000" }
}
```

**4. Webhook Demo (3 min)**

**Show webhook payload:**
```json
POST https://your-server.com/webhooks/swiftshopr
{
  "event": "payment.completed",
  "intent_id": "PI_abc123",
  "store_id": "PUBLIX_001",
  "amount": 42.99,
  "tx_hash": "0x...",
  "items": [...],
  "timestamp": "2025-12-23T15:30:00Z"
}
```

> "You receive this webhook the moment payment completes. Update your POS, trigger loyalty points, log to analytics."

**5. Q&A - Common Questions (2 min)**

**Q: What if the customer's phone dies?**
A: Payment already completed. We can resend receipt via email/SMS.

**Q: What if internet goes down?**
A: Payments are blockchain-based. Once submitted, they complete even if your connection drops.

**Q: How do we handle returns?**
A: We provide a refund API. Same 0.3% fee.

**Q: What about regulatory compliance?**
A: We handle all crypto regulations. You're just accepting payments like any payment processor.

---

## Demo Checklist

### Before the Demo

**Hardware:**
- [ ] iPhone/iPad with SwiftShopr app installed
- [ ] 5-10 products with real barcodes
- [ ] Laptop with SDK code open
- [ ] Projector/screen
- [ ] Second device for employee verification demo

**Software:**
- [ ] SwiftShopr app loaded with demo account
- [ ] Demo wallet funded with $100 USDC
- [ ] Backend API responsive (check status page)
- [ ] Slides prepared (ROI, architecture, pricing)

**Talking Points:**
- [ ] 90% fee reduction story
- [ ] Instant settlement vs 2-3 days
- [ ] No chargebacks
- [ ] Integration time (1-2 days)
- [ ] Customer experience improvement

**Materials to Share:**
- [ ] README.md printed or emailed
- [ ] Integration Guide PDF
- [ ] API Reference
- [ ] Pricing sheet
- [ ] Case study (once available)

---

## Demo Environment Setup

### Test Stores

Create demo stores with real-looking data:

```
STORE_DEMO_001 → "Target - Demo Store"
STORE_DEMO_002 → "Publix - Demo Store"
STORE_DEMO_003 → "Whole Foods - Demo Store"
```

### Test Products

Seed backend with recognizable products:

```
012345678901 → Coca-Cola 12 Pack ($6.99)
012345678902 → Doritos Nacho Cheese ($4.29)
012345678903 → Nature Valley Granola Bar ($3.49)
012345678904 → Tide Laundry Detergent ($12.99)
012345678905 → Charmin Toilet Paper ($8.99)
```

### Demo Account

Create a demo API key with:
- Unlimited rate limits
- Pre-funded wallet ($500 USDC)
- Test mode enabled
- All features unlocked

---

## After the Demo

### Immediate Follow-Up (Same Day)

Email within 2 hours:

```
Subject: SwiftShopr Demo - Next Steps

Hi [Name],

Great meeting with you today! Here are the resources we discussed:

📘 SDK Documentation: https://github.com/swiftshopr/sdk
📗 Integration Guide: [link]
📊 ROI Calculator: [link]

Next Steps:
1. Share with your dev team
2. Schedule technical call (if needed)
3. Pilot store selection

Timeline to Launch:
Week 1: Dev team integrates SDK (1-2 days)
Week 2: Internal testing
Week 3: Pilot in 1 store
Week 4: Rollout to more stores

Your estimated annual savings: $270,000

Let me know when you'd like to move forward!

Best,
[Your Name]
```

### Follow-Up Materials

Send within 24 hours:
- ROI calculator (Excel/Google Sheets)
- Integration timeline (Gantt chart)
- Reference architecture diagram
- Pilot store proposal

### Pilot Program

Offer a pilot:
```
Month 1: Free (no fees)
  - 1 store
  - 100% of transaction volume
  - Weekly check-ins

Month 2-3: 50% discount (0.15% fee)
  - 3-5 stores
  - Full analytics access

Month 4+: Full pricing (0.3% fee)
  - All stores
  - Dedicated support
```

---

## Demo Scripts by Role

### For CFO/Finance

**Focus:** ROI, fees, settlement, cash flow

> "You're paying 2.5-3.5% on credit cards. That's $250K-$350K/year for a $10M store. We charge 0.3%. Even with conservative 5% adoption, you save $13,500/year per store. Money hits your wallet in seconds, not days. No chargebacks to dispute."

**Show:** Savings calculator, settlement comparison chart

### For CTO/Engineering

**Focus:** Integration time, API quality, scalability

> "30 lines of code. 1-2 days to integrate. We handle blockchain, payments, fraud. You get a React Native component and REST API. 99.9% uptime on Render. No infrastructure to maintain. We scale from 10 to 10 million transactions."

**Show:** Code walkthrough, API docs, architecture diagram

### For VP of Stores/Operations

**Focus:** Customer experience, employee training, store operations

> "Customers scan as they shop, pay in 3 seconds, show phone to employee, done. Employees verify in 5 seconds - no training, no devices. Reduces checkout lines, frees up staff, improves throughput. Customers love it because it's fast. Employees love it because it's simple."

**Show:** Live customer journey, employee verification demo

### For CEO

**Focus:** Competitive advantage, innovation, brand

> "Publix, Walmart, Target are all testing Scan & Go. You can have it live in 4 weeks with zero capex. Be the first in your market with crypto payments. Customers see you as innovative. You save money from day one. No risk - pilot in one store first."

**Show:** Market trends, competitor analysis, pilot proposal

---

## Common Objections & Responses

| Objection | Response |
|-----------|----------|
| "Crypto is risky" | "USDC is a stablecoin - always $1. Backed by real dollars. No volatility." |
| "Customers won't use it" | "Start with early adopters. Even 5% adoption saves $13K/year. Grows from there." |
| "Integration sounds hard" | "1-2 days for your dev team. We have customers live in a week." |
| "What about refunds?" | "Same API, same fee. Money back in customer wallet instantly." |
| "Security concerns?" | "Screenshot-protected receipts. Blockchain verification. More secure than credit cards." |
| "Our app isn't ready" | "We can build a standalone app for your brand in 2 weeks." |

---

## Demo Success Metrics

After the demo, you should have:

- [ ] Executive buy-in (verbal "yes" or "let's pilot")
- [ ] Dev team contact info
- [ ] Pilot store selection discussed
- [ ] Timeline agreed upon
- [ ] Follow-up meeting scheduled

**Next Steps Commitment:**
- [ ] Technical call with dev team (within 1 week)
- [ ] Pilot proposal review (within 2 weeks)
- [ ] Contract negotiation (within 3 weeks)
- [ ] Pilot launch (within 4-6 weeks)

---

*SwiftShopr Demo Guide v1.0*
