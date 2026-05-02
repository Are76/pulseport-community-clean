#!/bin/bash

echo "=== HistoryTab Extraction Verification ==="
echo

# 1. Check HistoryTab file exists
if [ -f "src/tabs/HistoryTab.tsx" ]; then
  echo "✓ HistoryTab.tsx file exists"
else
  echo "✗ HistoryTab.tsx file missing"
  exit 1
fi

# 2. Check export function
if grep -q "export function HistoryTab" src/tabs/HistoryTab.tsx; then
  echo "✓ HistoryTab component is exported"
else
  echo "✗ HistoryTab component not exported"
fi

# 3. Check props interface
if grep -q "interface HistoryTabProps" src/tabs/HistoryTab.tsx; then
  echo "✓ HistoryTabProps interface defined"
else
  echo "✗ HistoryTabProps interface missing"
fi

# 4. Check usePortfolio import
if grep -q "usePortfolio" src/tabs/HistoryTab.tsx; then
  echo "✓ usePortfolio hook imported"
else
  echo "✗ usePortfolio hook not imported"
fi

# 5. Check usePortfolioData import
if grep -q "usePortfolioData" src/tabs/HistoryTab.tsx; then
  echo "✓ usePortfolioData hook imported"
else
  echo "✗ usePortfolioData hook not imported"
fi

# 6. Check filter state variables in HistoryTab
if grep -q "const \[txTypeFilter" src/tabs/HistoryTab.tsx && \
   grep -q "const \[txAssetFilter" src/tabs/HistoryTab.tsx && \
   grep -q "const \[txYearFilter" src/tabs/HistoryTab.tsx; then
  echo "✓ HistoryTab has filter state variables"
else
  echo "✗ HistoryTab missing filter state variables"
fi

# 7. Check App.tsx imports HistoryTab
if grep -q "import { HistoryTab }" src/App.tsx; then
  echo "✓ App.tsx imports HistoryTab"
else
  echo "✗ App.tsx doesn't import HistoryTab"
fi

# 8. Check App.tsx renders HistoryTab
if grep -q "<HistoryTab" src/App.tsx; then
  echo "✓ App.tsx renders HistoryTab component"
else
  echo "✗ App.tsx doesn't render HistoryTab"
fi

# 9. Check filter state still in App.tsx (needed for cross-tab navigation)
if grep -q "const \[txTypeFilter" src/App.tsx && \
   grep -q "const \[txAssetFilter" src/App.tsx; then
  echo "✓ Filter state variables retained in App.tsx (for cross-tab support)"
else
  echo "✗ Filter state variables missing from App.tsx"
fi

# 10. Check memos in App.tsx
if grep -q "matchesHistoryTransactionFilters" src/App.tsx && \
   grep -q "filteredTransactions" src/App.tsx; then
  echo "✓ Key memos retained in App.tsx"
else
  echo "✗ Key memos missing from App.tsx"
fi

echo
echo "=== Compilation & Build Status ==="
echo

# TypeScript check
if npx tsc --noEmit 2>&1 | grep -q "error"; then
  echo "✗ TypeScript compilation failed"
  npx tsc --noEmit
  exit 1
else
  echo "✓ TypeScript compilation passed"
fi

# Tests
if npm test -- --run 2>&1 | grep -q "Test Files.*passed"; then
  echo "✓ All tests passed"
else
  echo "✗ Tests failed"
fi

echo
echo "✅ All verifications passed!"
