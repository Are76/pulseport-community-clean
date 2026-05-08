# Modal Component Examples

Complete, copy-paste ready examples for common modal patterns using the compound component system.

## Example 1: Simple Modal

```tsx
import { useState } from 'react';
import { Modal } from '@/components/Modal';

export function SimpleModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Modal.Header title="Hello!" />
        <Modal.Body>
          This is a simple modal with no props needed for layout.
        </Modal.Body>
        <Modal.Footer>
          <button onClick={() => setIsOpen(false)}>Close</button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
```

## Example 2: Form Modal

```tsx
import { useState } from 'react';
import { FormModal } from '@/components/Modal';

export function AddWalletModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // API call here
      await new Promise(r => setTimeout(r, 1000));
      console.log('Wallet added:', name);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Add Wallet</button>

      <FormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        title="Add Wallet"
        subtitle="Create a new wallet for your portfolio"
        submitText="Add"
        isLoading={isLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Wallet Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Wallet"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      </FormModal>
    </>
  );
}
```

## Example 3: Confirmation Dialog

```tsx
import { useState } from 'react';
import { ConfirmModal } from '@/components/Modal';

export function DeleteAssetModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // API call to delete
      await new Promise(r => setTimeout(r, 800));
      console.log('Asset deleted');
      setIsOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="text-red-600">
        Delete
      </button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete Asset"
        message="Are you sure you want to delete this asset? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        isDangerous={true}
        isLoading={isDeleting}
      />
    </>
  );
}
```

## Example 4: Alert Modal

```tsx
import { useState } from 'react';
import { AlertModal } from '@/components/Modal';

export function ErrorAlertExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Show Error</button>

      <AlertModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        type="error"
        title="Operation Failed"
        message="Unable to save changes. Please check your connection and try again."
      />
    </>
  );
}
```

## Example 5: Multi-Step Modal

```tsx
import { useState } from 'react';
import { Modal } from '@/components/Modal';

export function MultiStepModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setIsOpen(false);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Start Setup</button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <Modal.Header 
          title="Setup Wizard" 
          subtitle={`Step ${step} of ${totalSteps}`}
        />
        <Modal.Body>
          {step === 1 && (
            <div>
              <h3 className="font-semibold mb-2">Select Your Chains</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked />
                  <span className="ml-2">PulseChain</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked />
                  <span className="ml-2">Ethereum</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked />
                  <span className="ml-2">Base</span>
                </label>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h3 className="font-semibold mb-2">Import Wallets</h3>
              <input 
                type="text" 
                placeholder="Enter wallet address"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          )}
          {step === 3 && (
            <div>
              <h3 className="font-semibold mb-2">Review Settings</h3>
              <p className="text-gray-600">Everything looks good. Ready to continue?</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer align="right">
          <button
            onClick={handlePrevious}
            disabled={step === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {step === totalSteps ? 'Complete' : 'Next'}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
```

## Example 6: Modal with useModal Hook

This shows how to close the modal from nested components using the `useModal` hook:

```tsx
import { Modal, useModal } from '@/components/Modal';
import { useState } from 'react';

function ModalContent() {
  const { onClose } = useModal();
  
  return (
    <div className="space-y-4">
      <p>You can access modal context from anywhere in the tree</p>
      <button
        onClick={onClose}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Close from here
      </button>
    </div>
  );
}

export function UseModalHookExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Modal.Header title="Using useModal Hook" />
        <Modal.Body>
          <ModalContent />
        </Modal.Body>
      </Modal>
    </>
  );
}
```

## Example 7: Modal with Custom Styling

```tsx
import { Modal } from '@/components/Modal';
import { useState } from 'react';

export function StyledModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
        <Modal.Header title="Custom Styled Modal" />
        <Modal.Body>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg text-purple-600 mb-2">
                Section One
              </h3>
              <p className="text-gray-600">Content for section one</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2">
                Highlighted Section
              </h3>
              <p className="text-gray-600">Content with custom styling</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">100</div>
                <div className="text-sm text-gray-500">Stats</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">99%</div>
                <div className="text-sm text-gray-500">Success Rate</div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer align="center">
          <button onClick={() => setIsOpen(false)}>Close</button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
```

## Example 8: Async Data Modal

```tsx
import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';

interface Asset {
  id: string;
  name: string;
  value: number;
}

export function AssetDetailsModal({ assetId }: { assetId: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setIsLoading(true);
    setError(null);

    // Simulate API call
    setTimeout(() => {
      setAsset({
        id: assetId,
        name: 'Sample Asset',
        value: 1000,
      });
      setIsLoading(false);
    }, 500);
  }, [assetId]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {
        setIsOpen(false);
        setAsset(null);
      }}
    >
      <Modal.Header title={asset?.name || 'Asset Details'} />
      <Modal.Body>
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin">⏳</div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}
        {error && (
          <div className="text-red-600">{error}</div>
        )}
        {asset && !isLoading && (
          <div className="space-y-4">
            <div>
              <span className="text-gray-600">ID:</span>
              <span className="ml-2 font-mono">{asset.id}</span>
            </div>
            <div>
              <span className="text-gray-600">Value:</span>
              <span className="ml-2 font-bold">${asset.value}</span>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button onClick={() => setIsOpen(false)}>Close</button>
      </Modal.Footer>
    </Modal>
  );
}
```

## Testing Examples

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/components/Modal';

describe('Modal Examples', () => {
  it('opens and closes modal', async () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Modal isOpen={false} onClose={onClose}>
        <div>Content</div>
      </Modal>
    );

    expect(screen.queryByText('Content')).not.toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={onClose}>
        <div>Content</div>
      </Modal>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('closes on escape key', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Content</div>
      </Modal>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('submits form modal', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <FormModal
        isOpen={true}
        onClose={() => {}}
        onSubmit={onSubmit}
        title="Test"
      >
        <input type="text" placeholder="Name" />
      </FormModal>
    );

    const input = screen.getByPlaceholderText('Name');
    await user.type(input, 'Test');
    await user.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalled();
  });
});
```
