# Wallets & Bridges Holdings Page — Design Document

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore and enhance the "Wallets & Bridges" page as the unified hub for viewing, filtering, and managing token holdings across all connected wallets with advanced search, scanning, and risk analysis.

**Architecture:** Refactor existing AssetsTab into modular, reusable components (HoldingsFilter, HoldingsList, CoinSearchModal, WalletScanner) that work together to provide comprehensive portfolio management. Add to sidebar navigation to make it discoverable.

**Tech Stack:** React, TypeScript, PortfolioContext (existing state management), Blockscout/RPC APIs, lucide-react icons, existing HoldingsTable component.

---

## Component Structure

### **HoldingsPage** (Main Container)
- **Responsibility:** Manages all state (filters, view mode, modal visibility), coordinates data flow
- **Props:** currentAssets, wallets, selectedWalletAddr, prices, hiddenTokens, hiddenSpamTokens, customCoins, etc.
- **State:** activeFilters (dust, chain, valueRange, tokenType, spamDetection, ownershipPercent, timeHeld), viewMode ('combined' | 'per-wallet'), showCoinSearchModal, showScannerModal, scanResults
- **Key Methods:** applyFilters(), toggleDustFilter(), updateChainFilter(), updateValueRange(), openCoinSearch(), scanWallets()

### **HoldingsFilter**
- **Responsibility:** Render all filter controls and handle filter updates
- **Props:** filters (object), onFilterChange (callback), availableChains, tokenTypes
- **Children Inputs:**
  - Dust toggle (boolean)
  - Chain multi-select (PulseChain, Ethereum, Base)
  - Value range slider ($0 - $100k+)
  - Token type multi-select (ERC-20, LP tokens, Custom)
  - Spam detection toggle (boolean)
  - Sort dropdown (by value, ownership %, time held)
- **Output:** Emits filter changes to parent

### **HoldingsList**
- **Responsibility:** Display filtered holdings with integrated HoldingsTable, handle view toggle
- **Props:** filteredAssets, viewMode, onToggleView, onRemoveCoin, onAddWatchlist
- **Features:**
  - View toggle: "Combined view" | "Per-wallet view"
  - Combined view: single aggregated list with totals
  - Per-wallet view: separate collapsible sections per wallet with subtotals
  - Renders HoldingsTable for each view with row-level actions (remove, watchlist, explorer)

### **CoinSearchModal**
- **Responsibility:** Search tokens by contract address (CA), preview info, allow user to add to watchlist or track holdings
- **Props:** isOpen, onClose, onAddCoin (callback)
- **State:** searchInput (CA address), searchResults, selectedChain (auto-detected or manual), selectedToken
- **Flow:**
  1. User enters CA address
  2. Auto-detect chain from CA
  3. Fetch token metadata (name, symbol, decimals, holders, contract age, 24h volume)
  4. Show preview: token icon, name, symbol, current price, holders count, contract age
  5. User chooses: "Add to Watchlist" or "Track Holdings"
  6. If "Track Holdings": prompt for amount user holds
  7. Call onAddCoin with token data and mode

### **WalletScanner**
- **Responsibility:** Scan connected wallets, identify tokens, analyze for spam/risk, display results
- **Props:** isOpen, onClose, wallets (addresses)
- **State:** isScanning, scanProgress (current wallet / total), scanResults (array of {token, riskScore, holders, contractAge, recommendation})
- **Flow:**
  1. Iterate through all connected wallet addresses
  2. Fetch assets from each wallet via Blockscout
  3. For each token, calculate risk score:
     - Holder concentration: (top 10 holder % / 100 wallets threshold)
     - Contract age: newer contracts = higher risk
     - Trading volume anomalies: low volume = suspect
     - Known blacklists: cross-reference spam token lists
  4. Assign recommendation: BUY (low risk), HOLD (medium risk), AVOID (high risk)
  5. Display results sorted by risk score (high to low)
  6. Allow user to "Hide" flagged tokens or "Add to Watchlist"

---

## Data Flow

```
HoldingsPage
├─ Fetch: currentAssets (from PortfolioContext)
├─ State: filters, viewMode, modals
│
├─ HoldingsFilter
│  └─ User updates filters
│     └─ Emit to HoldingsPage.applyFilters()
│        └─ Re-calculate filteredAssets
│
├─ HoldingsList
│  ├─ Input: filteredAssets, viewMode
│  ├─ User toggles: Combined | Per-wallet
│  ├─ User removes coin: onRemoveCoin → HoldingsPage.hideToken()
│  └─ User adds watchlist: onAddWatchlist → HoldingsPage.addToWatchlist()
│
├─ CoinSearchModal
│  ├─ User enters CA
│  ├─ Fetch token metadata
│  ├─ User chooses: Watchlist | Track Holdings
│  └─ Call HoldingsPage.addCoin(token, mode)
│
└─ WalletScanner
   ├─ User clicks "Scan Wallets"
   ├─ Iterate wallets, fetch assets, calculate risk
   ├─ Display results
   └─ User hides/adds tokens → HoldingsPage.hideToken() or .addToWatchlist()
```

---

## UI Layout

### **Page Header**
```
┌─────────────────────────────────────────────────────────┐
│ WALLET ANALYZER                                         │
│ Wallets & Bridges                                       │
│ Wallet-level holdings, bridge activity, and cross-chain│
│ movement.                                               │
│                                                         │
│ [Scan Wallets] [Add Coin] [Refresh]                   │
└─────────────────────────────────────────────────────────┘
```

### **View Toggle**
```
┌─ Combined View | Per-Wallet View ─────────────────────┐
```

### **Filter Bar**
```
┌─────────────────────────────────────────────────────────┐
│ 🏠 Hide Dust | Chains [PS][ETH][BASE] | Value [$][Slider]
│ Type [ERC-20][LP] | 🚫 Spam | Sort [Value ▼]          │
└─────────────────────────────────────────────────────────┘
```

### **Holdings Display (Combined View)**
```
┌─ Total: $XXX,XXX │ Coins: 45 | Dust (hidden): 12 ───────┐
├───────────────────────────────────────────────────────────┤
│ Token      CA              Balance  USD Value  %Port Risk  │
├───────────────────────────────────────────────────────────┤
│ PulseX     0x95B6...      1000     $2,500     12%  🟢Low │
│ HEX        0x2b59...      500k     $1,200     6%   🟢Low │
│ WPLS       0x70d9...      100      $150       0.7% 🟡Med │
│ ...                                                        │
└───────────────────────────────────────────────────────────┘
```

### **Holdings Display (Per-Wallet View)**
```
┌─ Wallet: 0xA1B2... (PulseChain) ── $5,200 ────────────┐
│ PulseX    1000     $2,500     12%  🟢 Low              │
│ HEX       500k     $1,200     6%   🟢 Low              │
│ ...                                                     │
└──────────────────────────────────────────────────────────┘
┌─ Wallet: 0xC3D4... (Ethereum) ── $3,100 ──────────────┐
│ USDC      1000     $1,000     5%   🟢 Low              │
│ WETH      5        $2,100     10%  🟡 Med              │
│ ...                                                     │
└──────────────────────────────────────────────────────────┘
```

### **Modals**
- **CoinSearchModal:** Input CA → Preview token → [Add to Watchlist] [Track Holdings] buttons
- **WalletScanner:** Progress bar "Scanning... 2/5 wallets" → Results table with risk scores → [Hide] [Add Watchlist] per token

---

## Key Features

### **1. Dust Filter (Automatic)**
- Coins with USD value <$10 are automatically hidden
- Toggle switch: "Show dust" reveals them in muted styling
- Count displayed: "Dust (hidden): 12"

### **2. CA-Based Search (Add Coins)**
- Modal with input: "Enter contract address (0x...)"
- Auto-detect chain from CA format
- Fetch and display: token name, symbol, icon, current price, holders, contract age, 24h volume
- Two actions:
  - **Add to Watchlist:** Monitor price changes, no holdings tracking
  - **Track Holdings:** User enters amount they own, tracked in PortfolioContext as custom coin
- Search results stored in customCoins array (PortfolioContext)

### **3. Wallet Scanner**
- Scans all connected wallet addresses across all chains
- For each token found, calculates risk score:
  - **Holder Concentration:** (top 10 holders % / expected distribution) — high concentration = higher risk
  - **Contract Age:** Tokens <7 days old = high risk, 7-30 days = medium, >30 days = low
  - **Volume Anomaly:** 24h volume vs market cap — low volume relative to supply = risky
  - **Blacklist Check:** Cross-reference known spam/scam token lists
- Risk levels: 🟢 Low (<30), 🟡 Medium (30-70), 🔴 High (>70)
- Display results sorted by risk (highest first)
- User can hide or add flagged tokens to watchlist

### **4. Comprehensive Filtering**
- **Dust Toggle:** Hide coins <$10 (default: hidden, toggle to show)
- **Chain Filter:** Multi-select PulseChain, Ethereum, Base
- **Value Range:** Slider from $0 to $100k+ (filters by USD value)
- **Token Type:** Multi-select ERC-20, LP tokens, Custom tokens
- **Spam Detection:** Toggle to hide/show tokens flagged as spam
- **Sort Options:** Value (high-to-low), Ownership % (high-to-low), Time Held (oldest-first)
- All filters use AND logic (must match ALL active filters)

### **5. Switchable Views**
- **Combined View:** All wallets summed, single aggregated list with total holdings value
- **Per-Wallet View:** Separate collapsible sections for each connected wallet, each with subtotals
- Toggle persists during session

### **6. Row Actions**
- View details / View on explorer
- Add to watchlist
- Remove from tracking / Hide token
- (Existing HoldingsTable row functionality)

---

## State Management

**PortfolioContext additions:**
- `customCoins` — Array of user-added coins (CA + amount if tracked)
- `watchlist` — Array of CA addresses user is monitoring (price only, no holdings)
- `hiddenTokens` — Array of CA addresses to hide from display
- `spamTokenIds` — Array of flagged spam tokens (already exists)

**Local HoldingsPage state:**
- `filters` — Object: { dust: boolean, chains: string[], valueRange: [min, max], tokenType: string[], spamDetection: boolean, sort: string }
- `viewMode` — 'combined' | 'per-wallet'
- `showCoinSearchModal` — boolean
- `showScannerModal` — boolean
- `scanResults` — Array of scan results with risk analysis

---

## Error Handling & Edge Cases

**CA Search:**
- Invalid CA address → Show error "Invalid contract address format"
- Token not found → "Token not found on selected chain"
- Network error → "Failed to fetch token data. Try again."

**Wallet Scanner:**
- No wallets connected → "Please add a wallet before scanning"
- Scan timeout → "Scan took too long. Try again or scan fewer wallets."
- Mixed results → Display partial results with warning badge

**Filtering:**
- No results match filters → "No tokens match your filters. Try adjusting."
- Dust filter all coins → "All coins are dust (<$10). Toggle 'Show dust' to see them."

**Edge Cases:**
- User removes watchlist coin still visible → Remove immediately from display
- User adds custom coin with 0 amount → Allow (for price monitoring), show warning "No holdings tracked"
- Contract age data unavailable → Show "—" and don't factor into risk score
- Very small balances (rounding errors) → Display with appropriate decimal places

---

## Testing Strategy

**Unit Tests:**
- Filter logic: verify AND logic works correctly
- Risk score calculation: verify formula with known values
- CA validation: valid/invalid format detection

**Integration Tests:**
- Add coin to watchlist → appears in display
- Remove coin → disappears from display
- View toggle: combined vs per-wallet calculations correct
- Scanner: identifies spam tokens correctly

**Manual Testing:**
- All filter combinations work together
- Performance: 100+ coins display smoothly
- Mobile responsiveness: filters and tables on small screens
- Modals: search and scanner on different screen sizes

---

## Sidebar Navigation Update

Add to `navItems` array in App.tsx:
```typescript
{ id: 'assets', label: 'Wallets & Bridges', icon: Wallet }, // or appropriate icon
```

Map to AssetsTab rendering block (currently exists but unmapped).

---

## Future Enhancements (Out of Scope)

- Price alerts for watchlist coins
- Advanced portfolio analysis (correlations, concentration risk)
- Bridge route visualization
- Historical dust accumulation tracking
- ML-based scam detection
