# builder codes

# **Builder Codes**

**Optional**

### **Track API Usage**

Builder codes help us attribute API usage to legitimate integrations and developers. If you're building a trading bot, tool, or integration, include your builder code in the `X-Builder-Code` header on all requests.

### **Get Your Builder Code**

1. Navigate to [Settings → Developer](https://app.propr.xyz/settings)
2. Find your builder code under the "Builder Code" section
3. Copy your builder code, it begins with `builder_`

Include your builder code in the `X-Builder-Code` header (optional but recommended):

```
curl -H "X-API-Key: <your_api_key>" \
     -H "X-Builder-Code: <your_builder_code>" \
  https://api.propr.xyz/v1/users/me
```

Copy

Header: X-Builder-Code: builder_...

Purpose: Attribution and usage tracking

Required: No (optional)

Format: builder_[16-character alphanumeric]

**Why use builder codes?** Builder codes help us identify legitimate API usage from bots and integrations, and credit the activity your integration drives back to you. This allows us to provide better support, track feature adoption, and ensure API stability for developers.