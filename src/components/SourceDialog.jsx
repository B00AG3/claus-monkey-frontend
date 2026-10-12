// Adapted from shadcn Dialog, retrieved through 21st.dev demo 47.
// Radix preserves focus trapping/restoration, dismissal, scroll locking, and inert outside content.
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef(function DialogOverlay({ className = '', ...props }, ref) {
  return <DialogPrimitive.Overlay ref={ref} className={`source-dialog-overlay ${className}`} {...props} />;
});
DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = React.forwardRef(function DialogContent(
  { className = '', children, closeLabel = 'Close', showClose = true, overlayClassName = '', ...props }, ref,
) {
  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content ref={ref} className={`source-dialog ${className}`} {...props}>
        {children}
        {showClose && <DialogPrimitive.Close className="source-dialog-close" aria-label={closeLabel}>
          <X size={22} strokeWidth={2} aria-hidden="true" />
        </DialogPrimitive.Close>}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = 'DialogContent';

function DialogHeader({ className = '', ...props }) {
  return <div className={`source-dialog-header ${className}`} {...props} />;
}
function DialogFooter({ className = '', ...props }) {
  return <div className={`source-dialog-footer ${className}`} {...props} />;
}
const DialogTitle = React.forwardRef(function DialogTitle({ className = '', ...props }, ref) {
  return <DialogPrimitive.Title ref={ref} className={`source-dialog-title ${className}`} {...props} />;
});
const DialogDescription = React.forwardRef(function DialogDescription({ className = '', ...props }, ref) {
  return <DialogPrimitive.Description ref={ref} className={`source-dialog-description ${className}`} {...props} />;
});

function SourceDialog({ open, onOpenChange, onClose, title, description, children, className, ...props }) {
  return <Dialog open={open} onOpenChange={onOpenChange || (next => { if (!next) onClose?.(); })}>
    <DialogContent className={className} {...(!description ? { 'aria-describedby': undefined } : {})} {...props}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      {children}
    </DialogContent>
  </Dialog>;
}

export { SourceDialog, Dialog, DialogTrigger, DialogPortal, DialogClose, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
export default SourceDialog;
