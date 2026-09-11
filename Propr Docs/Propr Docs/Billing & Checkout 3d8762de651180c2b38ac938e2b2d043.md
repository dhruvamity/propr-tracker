# Billing & Checkout

**Auth Required**

Create checkout sessions to purchase challenges. We support both card (fiat) and crypto payments.

**Builder Commissions:** When you include your `X-Builder-Code` header in checkout requests, you'll earn a commission on every successful purchase. This is how builders monetize their integrations, bots, and tools built on top of the Propr platform.

#### **Getting the Right Challenge Configuration**

Before creating a checkout session, you need to get the `priceId` for the challenge you want to purchase. Call `GET /challenges` to list all available challenges and their pricing.

**Request body fields:**

- `paymentMethod`**Required.** The payment provider to use: `card` for fiat/credit card, or `crypto` for crypto (USDC, USDT, etc)
- `priceId`**Required.** The URN identifier for the specific challenge price (e.g., `urn:prp-price:...`)
- `code`**Optional.** A discount or coupon code to apply to the purchase

### **Create Checkout Session**

**POST**

```
/checkout-sessions
```

Create a checkout session for the selected payment method.

Headers:

```
X-API-Key: <your_api_key>                 // required for authenticated requests
X-Builder-Code: <your_builder_code>       // required for builder attributions
```

Copy

Request body:

```
{
  "paymentMethod": "card",     // "card" (fiat) or "crypto" (crypto)
  "priceId": "urn:prp-price:...",
  "code": "DISCOUNT10"           // optional discount code
}
```

Copy

Response:

```
{
  "url": "https://checkout.stripe.com/..."
}
```

Copy

Redirect the user to the returned URL to complete payment. The provider will redirect back to your app after checkout.

#### **Checkout Flow**

1. Get available challenges and their prices via `GET /challenges`
2. Create a checkout session with the desired `priceId` and `paymentMethod`
3. Redirect user to the returned checkout URL
4. User completes payment with the selected payment method
5. User is redirected back to your app
6. Query `GET /challenge-attempts` to verify purchase

**Sandbox Testing:** Use the beta environment for testing checkout flows without real payments.