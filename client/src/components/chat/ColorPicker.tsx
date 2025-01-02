import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
];

interface ColorPickerProps {
  onColorSelected: (color: string) => void;
}

export function ColorPicker({ onColorSelected }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState<string>();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4">Choose Your Color</h2>
        <div className="grid grid-cols-5 gap-4 mb-6">
          {COLORS.map((color) => (
            <button
              key={color}
              className={`w-12 h-12 rounded-full transition-transform hover:scale-110 ${
                selectedColor === color ? "ring-4 ring-offset-2" : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
        <Button
          className="w-full"
          disabled={!selectedColor}
          onClick={() => selectedColor && onColorSelected(selectedColor)}
        >
          Join Chat
        </Button>
      </CardContent>
    </Card>
  );
}
