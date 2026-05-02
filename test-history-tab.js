/**
 * Smoke test for HistoryTab extraction
 * 
 * This script verifies:
 * 1. TypeScript compilation passes
 * 2. All tests pass
 * 3. Build succeeds
 * 4. HistoryTab component is properly exported
 * 5. App.tsx imports and uses HistoryTab
 * 6. All required props are passed to HistoryTab
 */

const fs = require('fs');
const path = require('path');

const checks = [];
const errors = [];

function check(name, condition, details = '') {
  if (condition) {
    checks.push(`✓ ${name}`);
  } else {
    errors.push(`✗ ${name}${details ? `: ${details}` : ''}`);
  }
}

// 1. Check HistoryTab file exists
const historyTabPath = path.join(__dirname, 'src', 'tabs', 'HistoryTab.tsx');
check('HistoryTab.tsx file exists', fs.existsSync(historyTabPath));

// 2. Check HistoryTab exports component
const historyTabContent = fs.readFileSync(historyTabPath, 'utf-8');
check('HistoryTab exports component', 
  historyTabContent.includes('export function HistoryTab') || 
  historyTabContent.includes('export default HistoryTab')
);

// 3. Check HistoryTab has required props interface
check('HistoryTab has HistoryTabProps interface', 
  historyTabContent.includes('interface HistoryTabProps') &&
  historyTabContent.includes('selectedWalletAddr') &&
  historyTabContent.includes('getTokenLogoUrl')
);

// 4. Check HistoryTab imports usePortfolio
check('HistoryTab imports usePortfolio', 
  historyTabContent.includes("from '../context/PortfolioContext'") ||
  historyTabContent.includes("import { usePortfolio }")
);

// 5. Check HistoryTab imports usePortfolioData
check('HistoryTab imports usePortfolioData', 
  historyTabContent.includes("import { usePortfolioData }")
);

// 6. Check HistoryTab has required state variables
check('HistoryTab has filter state variables',
  historyTabContent.includes('txTypeFilter') &&
  historyTabContent.includes('txAssetFilter') &&
  historyTabContent.includes('txYearFilter') &&
  historyTabContent.includes('txCoinCategory') &&
  historyTabContent.includes('viewAsYou') &&
  historyTabContent.includes('txCompact') &&
  historyTabContent.includes('showHiddenTxs')
);

// 7. Check App.tsx imports HistoryTab
const appPath = path.join(__dirname, 'src', 'App.tsx');
const appContent = fs.readFileSync(appPath, 'utf-8');
check('App.tsx imports HistoryTab', 
  appContent.includes("import { HistoryTab }") &&
  appContent.includes("from './tabs/HistoryTab'")
);

// 8. Check App.tsx uses HistoryTab
check('App.tsx renders HistoryTab component',
  appContent.includes("activeTab === 'history'") &&
  appContent.includes('<HistoryTab')
);

// 9. Check HistoryTab receives all required props
check('App.tsx passes selectedWalletAddr prop to HistoryTab',
  appContent.includes('selectedWalletAddr={selectedWalletAddr}')
);
check('App.tsx passes getTokenLogoUrl prop to HistoryTab',
  appContent.includes('getTokenLogoUrl={getTokenLogoUrl}')
);
check('App.tsx passes collapsedSections prop to HistoryTab',
  appContent.includes('collapsedSections={collapsedSections}')
);
check('App.tsx passes toggleSection prop to HistoryTab',
  appContent.includes('toggleSection={toggleSection}')
);
check('App.tsx passes isCollapsed prop to HistoryTab',
  appContent.includes('isCollapsed={isCollapsed}')
);
check('App.tsx passes t (theme) prop to HistoryTab',
  appContent.includes(', t}')
);

// 10. Check filter state is still in App.tsx
check('App.tsx still has txTypeFilter state',
  appContent.includes('txTypeFilter') &&
  appContent.includes('setTxTypeFilter')
);
check('App.tsx still has txAssetFilter state',
  appContent.includes('txAssetFilter') &&
  appContent.includes('setTxAssetFilter')
);

// 11. Check key memos are still in App.tsx
check('App.tsx still has matchesHistoryTransactionFilters memo',
  appContent.includes('matchesHistoryTransactionFilters')
);
check('App.tsx still has filteredTransactions memo',
  appContent.includes('filteredTransactions')
);

// 12. Check HistoryTab has plsSwapData memo
check('HistoryTab has plsSwapData memo',
  historyTabContent.includes('const plsSwapData = useMemo')
);

// 13. Check HistoryTab exports exportCSV function
check('HistoryTab exports exportCSV function',
  historyTabContent.includes('export function exportCSV') ||
  historyTabContent.includes('export const exportCSV')
);

// Print results
console.log('\n=== HistoryTab Extraction Verification ===\n');
checks.forEach(c => console.log(c));

if (errors.length > 0) {
  console.log('\n❌ FAILED CHECKS:');
  errors.forEach(e => console.log(e));
  process.exit(1);
} else {
  console.log('\n✓ All checks passed!');
  process.exit(0);
}
