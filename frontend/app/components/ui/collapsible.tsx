import React from "react"

// Context for collapsible state
const CollapsibleContext = React.createContext<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>({});

// Fallback collapsible implementation if Radix is not available
const Collapsible = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { open?: boolean; onOpenChange?: (open: boolean) => void }
>(({ children, open, onOpenChange, ...props }, ref) => {
  // Create a context to pass the onOpenChange to trigger
  const contextValue = React.useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);
  
  return (
    <CollapsibleContext.Provider value={contextValue}>
      <div ref={ref} {...props} data-state={open ? "open" : "closed"}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
})
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ children, onClick, asChild, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(CollapsibleContext);
  
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    onClick?.(e);
    onOpenChange?.(!open);
  };
  
  if (asChild) {
    // When asChild is true, pass props to the child element
    return React.isValidElement(children) 
      ? React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent<HTMLElement>) => void }>, { 
          onClick: (e: React.MouseEvent<HTMLElement>) => {
            handleClick(e);
            (children as React.ReactElement<{ onClick?: (e: React.MouseEvent<HTMLElement>) => void }>).props.onClick?.(e);
          },
          ...props 
        })
      : <>{children}</>
  }
  
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} onClick={handleClick} {...props}>
      {children}
    </button>
  )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => {
  const { open } = React.useContext(CollapsibleContext);
  
  if (!open) return null;
  
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }