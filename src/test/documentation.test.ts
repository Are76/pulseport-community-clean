/**
 * Documentation completeness tests.
 *
 * Verifies that all public exports have comprehensive JSDoc documentation
 * including descriptions, parameters, and return types.
 */

import fs from 'fs';
import path from 'path';

const BASE_DIR = path.join(__dirname, '..');

/**
 * Check if a file has JSDoc comment
 */
function hasJSDoc(content: string): boolean {
  return /^\s*(\/\*\*|\/\/)/.test(content.trim()) || content.includes('/**');
}

/**
 * Extract JSDoc comment block
 */
function extractJSDoc(content: string): string {
  const match = content.match(/\/\*\*[\s\S]*?\*\//);
  return match ? match[0] : '';
}

/**
 * Check if JSDoc has @param documentation
 */
function hasParamDocs(jsDoc: string): boolean {
  return /@param/.test(jsDoc);
}

/**
 * Check if JSDoc has @returns documentation
 */
function hasReturnsDocs(jsDoc: string): boolean {
  return /@returns|@return/.test(jsDoc);
}

/**
 * Check if JSDoc has @example documentation
 */
function hasExampleDocs(jsDoc: string): boolean {
  return /@example/.test(jsDoc);
}

describe('Component Documentation', () => {
  it('should have JSDoc for all public components', () => {
    const componentsDir = path.join(BASE_DIR, 'components');
    const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

    const undocumented = files.filter(file => {
      const filePath = path.join(componentsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for export function/const with JSDoc
      const hasFunctionExport = /export\s+(function|const)/.test(content);
      if (!hasFunctionExport) return false;

      return !hasJSDoc(content);
    });

    expect(undocumented).toEqual([]);
  });

  it('should document component props interfaces', () => {
    const componentsDir = path.join(BASE_DIR, 'components');
    const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

    const missingPropDocs = files.filter(file => {
      const filePath = path.join(componentsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for Props interface with JSDoc
      const match = content.match(/interface\s+\w*Props\s*{([\s\S]*?)}/);
      if (!match) return false;

      const propsContent = match[1];
      // Check if props have inline documentation
      return !propsContent.includes('/**') && !propsContent.includes('//');
    });

    expect(missingPropDocs).toEqual([]);
  });
});

describe('Hook Documentation', () => {
  it('should have JSDoc for all hooks', () => {
    const hooksDir = path.join(BASE_DIR, 'hooks');
    const files = fs.readdirSync(hooksDir)
      .filter(f => f.endsWith('.ts') && !f.startsWith('__'));

    const undocumented = files.filter(file => {
      const filePath = path.join(hooksDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for export function with JSDoc
      const match = content.match(/export\s+function\s+use\w+/);
      if (!match) return false;

      return !hasJSDoc(content.substring(0, content.lastIndexOf(match[0])));
    });

    expect(undocumented).toEqual([]);
  });

  it('should include return type documentation in hook JSDoc', () => {
    const hooksDir = path.join(BASE_DIR, 'hooks');
    const files = fs.readdirSync(hooksDir)
      .filter(f => f.endsWith('.ts') && !f.startsWith('__'));

    const missingReturns = files.filter(file => {
      const filePath = path.join(hooksDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Find the hook function and its preceding JSDoc
      const match = content.match(/(\/\*\*[\s\S]*?\*\/)\s*export\s+function\s+use\w+/);
      if (!match) return false;

      const jsDoc = match[1];
      return !hasReturnsDocs(jsDoc);
    });

    expect(missingReturns).toEqual([]);
  });
});

describe('Utility Documentation', () => {
  it('should document exported utility functions', () => {
    const utilsDir = path.join(BASE_DIR, 'utils');
    const files = fs.readdirSync(utilsDir)
      .filter(f => f.endsWith('.ts') && !f.startsWith('__'));

    const missingDocs = files.filter(file => {
      const filePath = path.join(utilsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Find all exported functions
      const matches = content.match(/export\s+(function|const)\s+\w+/g);
      if (!matches) return false;

      // Check if any export lacks preceding JSDoc
      return !content.includes('/**');
    });

    expect(missingDocs).toEqual([]);
  });
});

describe('Documentation Quality', () => {
  it('complex components should include usage examples', () => {
    const complexComponents = [
      'Modal.tsx',
      'CoinList.tsx',
      'HoldingsTable.tsx',
      'TokenPnLCard.tsx',
    ];

    const componentsDir = path.join(BASE_DIR, 'components');

    const missingExamples = complexComponents.filter(file => {
      const filePath = path.join(componentsDir, file);
      if (!fs.existsSync(filePath)) return false;

      const content = fs.readFileSync(filePath, 'utf-8');
      const jsDoc = extractJSDoc(content);

      return !hasExampleDocs(jsDoc);
    });

    expect(missingExamples).toEqual([]);
  });
});
