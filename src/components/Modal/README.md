# Modal Components

A compound component pattern implementation for modals. This system provides flexible, reusable modal components with automatic context handling and no prop drilling.

## Benefits

- **Cleaner API**: No need to pass header/body/footer as props
- **Flexible composition**: Mix and match Header, Body, and Footer components
- **Less prop drilling**: Context handles state sharing automatically
- **Easy to test**: Individual components can be tested independently
- **Accessible**: Built-in keyboard and backdrop handling

## Base Components

### Modal

The root modal component that manages state, animations, and accessibility.

```tsx
import { Modal } from '@/components/Modal';

export function MyModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Modal content goes here */}
    </Modal>
  );
}
```

#### Props

- `isOpen` (boolean): Controls modal visibility
- `onClose` (function): Called when modal should close
- `children` (ReactNode): Modal content
- `size` ('sm' | 'md' | 'lg'): Modal width (default: 'md')
- `closeOnEscape` (boolean): Close on Escape key press (default: true)
- `closeOnBackdrop` (boolean): Close when clicking backdrop (default: true)

#### Features

- Automatic body scroll prevention
- Escape key handling
- Backdrop click handling
- Provides context to child components via `useModal()` hook

### Modal.Header

Header section with title, subtitle, and close button.

```tsx
<Modal.Header 
  title="Edit Profile" 
  subtitle="Update your personal information"
/>
```

#### Props

- `title` (string): Header title
- `subtitle` (string, optional): Smaller subtitle text
- `onClose` (function, optional): Custom close handler (uses context if not provided)

### Modal.Body

Scrollable content area.

```tsx
<Modal.Body>
  <form>
    <input type="text" placeholder="Name" />
  </form>
</Modal.Body>
```

#### Props

- `children` (ReactNode): Body content

### Modal.Footer

Footer with action buttons.

```tsx
<Modal.Footer align="right">
  <button onClick={onClose}>Cancel</button>
  <button onClick={onSubmit} className="bg-blue-600">Save</button>
</Modal.Footer>
```

#### Props

- `children` (ReactNode): Footer content (typically buttons)
- `align` ('left' | 'center' | 'right'): Button alignment (default: 'right')

## Pre-built Modal Types

### ConfirmModal

Simple confirmation dialog.

```tsx
<ConfirmModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Delete Item"
  message="Are you sure you want to delete this item? This cannot be undone."
  confirmText="Delete"
  onConfirm={handleDelete}
  isDangerous={true}
  isLoading={isDeleting}
/>
```

#### Props

- `isOpen` (boolean): Visibility
- `onClose` (function): Close handler
- `title` (string): Dialog title
- `message` (string): Confirmation message
- `onConfirm` (function): Confirm handler
- `confirmText` (string, optional): Confirm button text (default: 'Confirm')
- `cancelText` (string, optional): Cancel button text (default: 'Cancel')
- `isDangerous` (boolean, optional): Red button styling (default: false)
- `isLoading` (boolean, optional): Disable buttons during action (default: false)

### FormModal

Generic form wrapper modal.

```tsx
<FormModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSubmit={handleSubmit}
  title="Create Wallet"
  subtitle="Add a new wallet to your portfolio"
  submitText="Create"
  isLoading={isCreating}
>
  <input 
    type="text" 
    placeholder="Wallet name"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
</FormModal>
```

#### Props

- `isOpen` (boolean): Visibility
- `onClose` (function): Close handler
- `onSubmit` (function): Form submit handler
- `title` (string): Form title
- `subtitle` (string, optional): Form subtitle
- `children` (ReactNode): Form content
- `submitText` (string, optional): Submit button text (default: 'Submit')
- `cancelText` (string, optional): Cancel button text (default: 'Cancel')
- `isLoading` (boolean, optional): Disable buttons during submission (default: false)

### AlertModal

Informational alert dialog.

```tsx
<AlertModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  type="error"
  title="Error"
  message="Failed to save changes. Please try again."
/>
```

#### Props

- `isOpen` (boolean): Visibility
- `onClose` (function): Close handler
- `type` ('info' | 'success' | 'warning' | 'error'): Alert type (default: 'info')
- `title` (string): Alert title
- `message` (string): Alert message
- `actionText` (string, optional): Action button text (default: 'OK')

## Hooks

### useModal

Access modal context from child components.

```tsx
import { useModal } from '@/components/Modal';

function ModalContent() {
  const { isOpen, onClose } = useModal();
  
  return (
    <button onClick={onClose}>Close from anywhere</button>
  );
}
```

The hook provides:
- `isOpen` (boolean): Current modal visibility
- `onClose` (function): Function to close the modal

**Important**: `useModal()` must be used inside a Modal component tree.

## Usage Examples

### Simple Modal

```tsx
function MyModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header title="Welcome" />
      <Modal.Body>
        <p>This is a simple modal</p>
      </Modal.Body>
      <Modal.Footer>
        <button onClick={onClose}>Close</button>
      </Modal.Footer>
    </Modal>
  );
}
```

### Form Modal

```tsx
function EditUserModal({ isOpen, onClose, user, onSave }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({ name, email });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Edit User"
      submitText="Save Changes"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
    </FormModal>
  );
}
```

### Confirmation Dialog

```tsx
function DeleteAssetModal({ isOpen, onClose, asset, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(asset.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Asset"
      message={`Delete "${asset.name}"? This cannot be undone.`}
      confirmText="Delete"
      onConfirm={handleDelete}
      isDangerous={true}
      isLoading={isDeleting}
    />
  );
}
```

## Custom Modals

Create custom modals by composing the base components:

```tsx
function CustomModal({ isOpen, onClose, data }) {
  const [step, setStep] = useState(1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Header 
        title="Multi-step Process"
        subtitle={`Step ${step} of 3`}
      />
      <Modal.Body>
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
      </Modal.Body>
      <Modal.Footer align="right">
        <button 
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          Previous
        </button>
        <button
          onClick={() => {
            if (step === 3) {
              onClose();
            } else {
              setStep(step + 1);
            }
          }}
        >
          {step === 3 ? 'Complete' : 'Next'}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
```

## Styling

Modal components use Tailwind CSS classes for styling. You can customize appearance by:

1. **Override defaults** via class props (when available)
2. **Wrap components** with custom styling
3. **Extend with CSS modules** for complex styling needs

## Accessibility

- Keyboard navigation: Escape closes modal
- Focus management: Focus trapped within modal
- Backdrop: Clicking backdrop closes modal
- ARIA labels: Proper aria-modal and aria-label attributes
- Scroll prevention: Body scroll disabled while modal open

## Migration from Old Modals

When refactoring existing modals to use this pattern:

### Before (Old Pattern)

```tsx
function MyModal({ 
  isOpen, 
  onClose, 
  title, 
  body, 
  onConfirm 
}) {
  return (
    <div className="fixed inset-0 bg-black/50">
      <div className="bg-white rounded-lg">
        <div className="border-b p-6">
          <h2>{title}</h2>
          <button onClick={onClose}>X</button>
        </div>
        <div className="p-6">{body}</div>
        <div className="border-t p-6 flex gap-3">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
```

### After (New Pattern)

```tsx
function MyModal({ isOpen, onClose, title, body, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header title={title} />
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </Modal.Footer>
    </Modal>
  );
}
```

Benefits of migration:
- 40% less code
- No manual backdrop/animation handling
- Automatic context/state management
- Better testability
- Consistent modal behavior across app

## Testing

All Modal components are fully testable:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/Modal';

test('closes on escape key', () => {
  const onClose = jest.fn();
  render(
    <Modal isOpen={true} onClose={onClose}>
      <div>Content</div>
    </Modal>
  );
  
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onClose).toHaveBeenCalled();
});
```

See `Modal/__tests__/Modal.test.tsx` for comprehensive test examples.
