# payouts & wallet

# **Wallet Verification**

**Auth Required**

Link a wallet to your account using Sign-In With Ethereum (SIWE / EIP-4361). This wallet will be used for receiving payouts.

**Three-Step Flow:**

1. Get a nonce from the server

2. Sign an EIP-4361 message with the user's wallet

3. Submit the signed message to link the wallet

**GET**

```
/wallet/nonce
```

Get a nonce for SIWE message signing

**POST**

```
/wallet/link
```

Link a wallet by submitting signed SIWE message

**GET**

```
/wallet/credentials
```

List all linked wallets for the authenticated user

**PUT**

```
/wallet/credentials/:credentialId/primary
```

Set a wallet as the primary payout destination

**DELETE**

```
/wallet/credentials/:credentialId
```

Unlink a wallet from the account

### **Step 1: Get Nonce**

```
GET https://api.propr.xyz/v1/wallet/nonce
Authorization: Bearer <access_token>

Response:
{
  "nonce": "abc123xyz..."
}
```

Copy

### **Step 2: Build and Sign SIWE Message**

```
// SIWE message format (EIP-4361)
const message = `Verify wallet ownership on Propr.

URI: https://app.propr.xyz
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

// Sign with user's wallet (e.g., using wagmi, ethers, viem)
const signature = await wallet.signMessage(message);
```

Copy

### **Step 3: Link Wallet**

```
POST https://api.propr.xyz/v1/wallet/link
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message": "Verify wallet ownership on Propr.\n\nURI: ...",
  "signature": "0xabc123...",
  "ecosystem": "evm"
}

Response:
{
  "credentialId": "urn:prp-credential:WJNMhkWN5tLD",
  "address": "0x1234567890abcdef...",
  "ecosystem": "evm",
  "primaryWallet": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Copy

### **List Linked Wallets**

```
GET https://api.propr.xyz/v1/wallet/credentials
Authorization: Bearer <access_token>

Response:
[
  {
    "credentialId": "urn:prp-credential:WJNMhkWN5tLD",
    "address": "0x1234567890abcdef...",
    "ecosystem": "evm",
    "primaryWallet": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

Copy

# **Payout Requests**

**Auth Required**

Request payouts from trading accounts or referral earnings. A linked wallet is required before requesting payouts.

**Payout Types:**

- **Account Payouts:** Withdraw profits from b-book or challenge accounts
- **Referral Payouts:** Claim accumulated referral commissions

**POST**

```
/payouts/request
```

Request a payout (account or referral)

**GET**

```
/payouts/history
```

Get payout history for the authenticated user

**POST**

```
/payouts/:payoutId/cancel
```

Cancel a pending payout request

**GET**

```
/payouts/referral/available
```

Get currently claimable referral earnings

### **Request Account Payout**

```
POST https://api.propr.xyz/v1/payouts/request
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "account",
  "credentialId": "urn:prp-credential:WJNMhkWN5tLD",
  "accountId": "urn:prp-account:xyz789"
}

Response:
{
  "payoutId": "urn:prp-payout:abc123",
  "userId": "urn:prp-user:11tpgpRJKnnz",
  "type": "on_chain",
  "reason": "account",
  "credentialId": "urn:prp-credential:WJNMhkWN5tLD",
  "status": "requested",
  "amount": "1500.00",
  "accountId": "urn:prp-account:xyz789",
  "userAmount": "1425.00",
  "systemAmount": "75.00",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Copy

### **Request Referral Payout**

```
POST https://api.propr.xyz/v1/payouts/request
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "referral",
  "credentialId": "urn:prp-credential:WJNMhkWN5tLD"
}

Response:
{
  "payoutId": "urn:prp-payout:def456",
  "userId": "urn:prp-user:11tpgpRJKnnz",
  "type": "on_chain",
  "reason": "referral",
  "credentialId": "urn:prp-credential:WJNMhkWN5tLD",
  "status": "requested",
  "amount": "250.00",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Copy

### **Check Available Referral Earnings**

```
GET https://api.propr.xyz/v1/payouts/referral/available
Authorization: Bearer <access_token>

Response:
{
  "userId": "urn:prp-user:11tpgpRJKnnz",
  "totalAmount": "250.00",
  "lineCount": 15,
  "byCode": [
    {
      "referralCodeId": "urn:prp-referral-code:abc123",
      "code": "MYCODE",
      "type": "standard",
      "commissionPercent": "10.00",
      "lineCount": 15,
      "earnedAmount": "250.00"
    }
  ]
}
```

Copy

### **Get Payout History**

```
GET https://api.propr.xyz/v1/payouts/history?status=processed&limit=10
Authorization: Bearer <access_token>

Response:
{
  "data": [
    {
      "payoutId": "urn:prp-payout:abc123",
      "type": "on_chain",
      "reason": "account",
      "status": "processed",
      "amount": "1500.00",
      "txHash": "0xabc123...",
      "processedAt": "2024-01-01T12:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

Copy

### **Payout Status Flow**

| **Status** | **Description** |
| --- | --- |
| requested | Payout has been requested, pending admin approval |
| processing | Admin approved, transaction is being broadcast |
| processed | Transaction confirmed on-chain, payout complete |
| rejected | Admin rejected the payout request |
| cancelled | User cancelled the payout before processing |
| failed | Transaction failed, payout unsuccessful |

**Important Notes:**

- You must have at least one linked wallet before requesting payouts
- The primary wallet will be used as the payout destination
- Account payouts require the `accountId` parameter
- Referral payouts automatically calculate available earnings
- Payouts go through admin approval before being processed on-chain
- You can cancel a payout while it's in `requested` status