"use client";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <label className="space-y-2">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-border/70 bg-background p-1 cursor-pointer"
      />
    </label>
  );
}
