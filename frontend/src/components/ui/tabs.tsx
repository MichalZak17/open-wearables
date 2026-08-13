import * as React from 'react';

import { cn } from '@/lib/utils';

type TabsVariant = 'segmented' | 'underline';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  variant: TabsVariant;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined
);

function useTabsContext(component: string) {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error(`${component} must be used within Tabs`);
  }
  return context;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  /** Visual style of the tab bar. Defaults to the boxed segmented control. */
  variant?: TabsVariant;
}

export function Tabs({
  value,
  onValueChange,
  children,
  className,
  variant = 'segmented',
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange, variant }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  const { variant } = useTabsContext('TabsList');

  return (
    <div
      role="tablist"
      className={cn(
        variant === 'underline'
          ? 'flex items-center gap-6 border-b border-border text-muted-foreground'
          : 'inline-flex h-10 items-center justify-center rounded-md bg-card/40 p-1 text-muted-foreground',
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { value: activeValue, onValueChange, variant } =
    useTabsContext('TabsTrigger');
  const isActive = activeValue === value;

  const base =
    'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variantClasses =
    variant === 'underline'
      ? cn(
          '-mb-px gap-2 border-b-2 px-1 pb-3 pt-2 focus-visible:ring-offset-0',
          isActive
            ? 'border-foreground text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground/90'
        )
      : cn(
          'rounded-sm px-3 py-1.5',
          isActive
            ? 'bg-muted text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground/90'
        );

  return (
    <button
      type="button"
      role="tab"
      id={`tab-${value}`}
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      onClick={() => onValueChange(value)}
      className={cn(base, variantClasses, className)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = useTabsContext('TabsContent');

  if (context.value !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={cn(
        'mt-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {children}
    </div>
  );
}
