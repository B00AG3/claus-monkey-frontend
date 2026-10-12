// Adapted from Origin UI Popover, retrieved through 21st.dev demo 397.
import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef(function PopoverContent(
  { className = '', align = 'center', sideOffset = 8, showArrow = false, children, ...props }, ref,
) {
  return <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content ref={ref} align={align} sideOffset={sideOffset} className={`source-popover ${className}`} {...props}>
      {children}
      {showArrow && <PopoverPrimitive.Arrow className="source-popover-arrow" />}
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>;
});
PopoverContent.displayName = 'PopoverContent';

function SourcePopover({ trigger, children, open, onOpenChange, ...props }) {
  return <Popover open={open} onOpenChange={onOpenChange}>
    <PopoverTrigger asChild>{trigger}</PopoverTrigger>
    <PopoverContent {...props}>{children}</PopoverContent>
  </Popover>;
}

export { SourcePopover, Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
export default SourcePopover;
