// Adapted from Origin UI Button (21st.dev demo 141); original source is in references/21st.
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

const buttonVariants = cva('source-button', {
  variants: {
    variant: {
      default: 'source-button--default',
      destructive: 'source-button--destructive',
      outline: 'source-button--outline',
      secondary: 'source-button--secondary',
      ghost: 'source-button--ghost',
      link: 'source-button--link',
    },
    size: {
      default: 'source-button--default-size',
      sm: 'source-button--sm',
      lg: 'source-button--lg',
      icon: 'source-button--icon',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

const SourceButton = React.forwardRef(function SourceButton(
  { className, variant, size, asChild = false, type = 'button', ...props }, ref,
) {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={buttonVariants({ variant, size, className })} {...(!asChild ? { type } : {})} {...props} />;
});
SourceButton.displayName = 'SourceButton';

export { SourceButton, SourceButton as Button, buttonVariants };
export default SourceButton;
