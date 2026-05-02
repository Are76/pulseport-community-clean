# Moralis Stream Setup

Use this endpoint for Moralis live wallet activity webhooks:

- `https://<your-domain>/api/moralis/stream`

## Recommended first stream

- Chains: `Ethereum`, `Base`
- Wallet addresses: the addresses you track for source funding
- Native transfers: `on`
- Internal transfers: `off` initially
- Smart contract events: `ERC20 transfers` if you want stablecoin/token inflows
- Include related transactions: `on`
- Include related logs: `off` initially
- Exclude spam: `on`

## Why this split

Use Moralis Streams for new inbound funding events from Ethereum and Base.

Do not make this the primary source for:

- PulseChain price logic
- PulseChain swap P&L
- final cost-basis decisions

Those stay in PulsePort app logic.

## Local testing

For local development, expose the dev server with a public HTTPS URL:

- `ngrok`
- `cloudflared`

Then point Moralis to:

- `https://<public-tunnel>/api/moralis/stream`

## Current endpoint behavior

The webhook currently:

- accepts `POST`
- logs a compact summary of the payload
- returns `200 OK`

Next step after basic delivery works:

- persist events
- deduplicate by tx hash + log index
- map Ethereum/Base inflows into funding attribution
