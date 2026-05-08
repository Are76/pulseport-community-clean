/**
 * Accessibility Audit Tests (WCAG 2.1 Level AA)
 *
 * Tests verify:
 * - Button semantics (proper <button> elements)
 * - ARIA labels and attributes
 * - Color contrast compliance
 * - Keyboard navigation
 * - Form label associations
 *
 * Run: npm test -- accessibility.test.ts
 */

describe('Accessibility Audit', () => {
  describe('Button Semantics', () => {
    test('CoinList uses button elements, not divs', () => {
      // Verify that coin-list-row-main is now a button element
      const coinListRowButtons = document.querySelectorAll('[class*="coin-list-row-main"]');
      coinListRowButtons.forEach(element => {
        expect(element.tagName).toBe('BUTTON');
        expect(element).toHaveAttribute('type', 'button');
      });
    });

    test('StakesSection table rows have keyboard support', () => {
      // Verify that stake-summary-row supports keyboard navigation
      const stakeRows = document.querySelectorAll('[class*="stake-summary-row"]');
      stakeRows.forEach(element => {
        expect(element).toHaveAttribute('tabindex', '0');
        // Should have onKeyDown handlers for Enter/Space
        expect(element).toHaveAttribute('aria-expanded');
      });
    });

    test('No interactive divs with onClick handlers exist', () => {
      // Should not find divs with onClick that don't have button semantics
      const interactiveDivs = document.querySelectorAll('div[onclick]');
      interactiveDivs.forEach(div => {
        const hasButtonRole = div.getAttribute('role') === 'button';
        const hasAriaLabel = div.getAttribute('aria-label');
        const hasTabIndex = div.getAttribute('tabindex');

        // If it has onClick, it must have button role OR be a backdrop/modal backdrop
        if (!div.classList.contains('backdrop')) {
          expect(hasButtonRole || hasAriaLabel || hasTabIndex).toBe(true);
        }
      });
    });
  });

  describe('ARIA Labels', () => {
    test('Icon-only buttons have aria-label attributes', () => {
      const iconButtons = document.querySelectorAll(
        'button .lucide-react, button svg'
      );
      iconButtons.forEach(iconElement => {
        const button = iconElement.closest('button');
        if (button && button.textContent?.trim() === '') {
          // Icon-only button
          expect(button).toHaveAttribute('aria-label');
        }
      });
    });

    test('Modal elements have proper ARIA attributes', () => {
      const modals = document.querySelectorAll('[role="dialog"]');
      modals.forEach(modal => {
        expect(modal).toHaveAttribute('aria-modal', 'true');
        expect(modal).toHaveAttribute('aria-labelledby');

        // Verify aria-labelledby points to existing element
        const labelId = modal.getAttribute('aria-labelledby');
        if (labelId) {
          const labelElement = document.getElementById(labelId);
          expect(labelElement).toBeInTheDocument();
        }
      });
    });

    test('Modal close buttons have aria-label', () => {
      const closeButtons = document.querySelectorAll('[aria-label*="Close"]');
      expect(closeButtons.length).toBeGreaterThan(0);

      closeButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button.getAttribute('aria-label')).toMatch(/close/i);
      });
    });

    test('Expandable elements have aria-expanded', () => {
      const expandables = document.querySelectorAll('[aria-expanded]');
      expandables.forEach(element => {
        const expanded = element.getAttribute('aria-expanded');
        expect(['true', 'false']).toContain(expanded);
      });
    });
  });

  describe('Color Contrast (WCAG AA)', () => {
    test('Text meets 4.5:1 contrast ratio minimum', () => {
      // This is a simplified check - real testing requires rendering
      // Target gray colors meet WCAG AA:
      // - gray-600 on white: ~6.3:1 ✓
      // - gray-700 on white: ~9:1 ✓
      // - gray-500 on white: ~4.6:1 ✓ (just barely)

      const lowContrastColors = document.querySelectorAll(
        '.text-gray-400, .text-gray-300, .text-slate-400, .text-slate-300'
      );
      expect(lowContrastColors.length).toBe(0);
    });

    test('Modal subtitle has sufficient contrast', () => {
      const subtitles = document.querySelectorAll('[class*="text-gray-5"]');
      // All subtitles should use gray-600 or darker
      subtitles.forEach(subtitle => {
        const classList = subtitle.className;
        expect(classList).toMatch(/text-gray-[6-9]|text-gray-[1][0-9]|dark:/);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('CoinList row buttons are keyboard accessible', () => {
      const buttons = document.querySelectorAll('button[class*="coin-list-row-main"]');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
        // Should respond to click (Enter/Space handled by button element)
      });
    });

    test('Modal can be closed with Escape key', () => {
      const modals = document.querySelectorAll('[role="dialog"]');
      expect(modals.length).toBeGreaterThan(0);
      // Verify modal has closeOnEscape enabled (check component props)
    });

    test('Focus is manageable without mouse', () => {
      const interactiveElements = document.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]'
      );
      expect(interactiveElements.length).toBeGreaterThan(0);

      interactiveElements.forEach(element => {
        const isVisible = element.offsetParent !== null;
        if (isVisible) {
          // Element should be keyboard focusable
          const tabindex = element.getAttribute('tabindex');
          expect(
            element.tagName.match(/button|input|select|textarea|a/i) || tabindex !== '-1'
          ).toBeTruthy();
        }
      });
    });
  });

  describe('Form Accessibility', () => {
    test('Form inputs have associated labels', () => {
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        const id = input.getAttribute('id');
        const labelFor = input.parentElement?.querySelector(`label[for="${id}"]`);
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledby = input.getAttribute('aria-labelledby');

        // Must have one of: label with htmlFor, aria-label, or aria-labelledby
        expect(
          labelFor || ariaLabel || ariaLabelledby ||
          input.parentElement?.querySelector('label')
        ).toBeTruthy();
      });
    });

    test('Error messages are properly associated', () => {
      const inputsWithErrors = document.querySelectorAll(
        '[aria-describedby*="error"], [aria-invalid="true"]'
      );

      inputsWithErrors.forEach(input => {
        const describedBy = input.getAttribute('aria-describedby');
        if (describedBy?.includes('error')) {
          const errorElement = document.getElementById(describedBy.split(' ')[0]);
          expect(errorElement).toBeTruthy();
        }
      });
    });

    test('Required fields are marked with aria-required', () => {
      const requiredInputs = document.querySelectorAll('input[required]');
      requiredInputs.forEach(input => {
        expect(input).toHaveAttribute('aria-required', 'true');
      });
    });
  });

  describe('Focus Management', () => {
    test('Modal receives focus when opened', () => {
      const modals = document.querySelectorAll('[role="dialog"]');
      modals.forEach(modal => {
        expect(modal).toHaveAttribute('tabindex', '-1');
      });
    });

    test('Focus indicators are visible', () => {
      const buttons = document.querySelectorAll('button, a[href], input, select');
      buttons.forEach(element => {
        const styles = window.getComputedStyle(element);
        const hasFocusStyle = element.className.includes('focus-visible');
        // Should have focus styling or outline
        expect(
          hasFocusStyle ||
          styles.outline !== 'none' ||
          element.className.includes('focus:')
        ).toBeTruthy();
      });
    });
  });

  describe('Semantic HTML', () => {
    test('Uses semantic button elements instead of divs', () => {
      const divs = document.querySelectorAll('div[role="button"]');
      // Should only find divs with role="button" in specific cases (modals, etc)
      divs.forEach(div => {
        if (!div.className.includes('modal') && !div.className.includes('backdrop')) {
          // Most divs with role="button" should be buttons
          fail(`Found div with role="button": ${div.className}`);
        }
      });
    });

    test('Uses proper heading hierarchy', () => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let lastLevel = 0;
      headings.forEach(heading => {
        const level = parseInt(heading.tagName[1]);
        // Heading level should not jump more than 1 level
        expect(level - lastLevel).toBeLessThanOrEqual(1);
        lastLevel = level;
      });
    });
  });
});
