"use client";

import { createContext, useContext, useId, useState } from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const baseId = useId();
  const value = controlledValue ?? uncontrolled;

  const handleChange = (next: string) => {
    if (controlledValue === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider
      value={{ value, onValueChange: handleChange, baseId }}
    >
      <div className={cn("flex flex-col gap-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  onKeyDown,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { onValueChange } = useTabsContext();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const triggers = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')
    );
    const currentIndex = triggers.indexOf(document.activeElement as HTMLButtonElement);
    if (currentIndex === -1) return;

    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % triggers.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = triggers.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const next = triggers[nextIndex];
    const nextValue = next.dataset.value;
    if (nextValue) onValueChange(nextValue);
    next.focus();
  };

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center justify-start gap-1 rounded-lg border border-border bg-card p-1 text-muted",
        className,
      )}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { value: active, onValueChange, baseId } = useTabsContext();
  const selected = active === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      data-state={selected ? "active" : "inactive"}
      data-value={value}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        "data-[state=inactive]:text-muted hover:text-foreground",
        className,
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { value: active, baseId } = useTabsContext();
  if (active !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
