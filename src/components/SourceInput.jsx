// Adapted from the shadcn Input registry dependency retrieved with 21st.dev Dialog 47.
import * as React from 'react';

const SourceInput = React.forwardRef(function SourceInput({ className = '', type = 'text', ...props }, ref) {
  return <input ref={ref} type={type} className={`source-input ${className}`} {...props} />;
});
SourceInput.displayName = 'SourceInput';

export { SourceInput, SourceInput as Input };
export default SourceInput;
