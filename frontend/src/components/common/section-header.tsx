interface SectionHeaderProps {
  title: string;
  rightContent?: React.ReactNode;
}

/**
 * A reusable card section header: a title on the left and optional content on
 * the right. The date-range selector now lives globally in the tab bar, so it
 * is no longer a responsibility of this component.
 */
export function SectionHeader({ title, rightContent }: SectionHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {rightContent}
    </div>
  );
}
