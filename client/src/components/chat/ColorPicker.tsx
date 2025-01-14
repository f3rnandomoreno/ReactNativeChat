import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface Color {
  hex: string;
  name: string;
}

const COLORS: Color[] = [
  { hex: "#ef4444", name: "Rojo Pasión" },
  { hex: "#f97316", name: "Naranja Energía" },
  { hex: "#f59e0b", name: "Ámbar Calidez" },
  { hex: "#84cc16", name: "Lima Frescura" },
  { hex: "#22c55e", name: "Verde Esperanza" },
  { hex: "#06b6d4", name: "Cian Serenidad" },
  { hex: "#3b82f6", name: "Azul Libertad" },
  { hex: "#6366f1", name: "Índigo Sabiduría" },
  { hex: "#a855f7", name: "Púrpura Creatividad" },
  { hex: "#ec4899", name: "Rosa Empatía" },
];

interface ColorPickerProps {
  onColorSelected: (color: string) => void;
}

export function ColorPicker({ onColorSelected }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState<string>();
  const [hoveredColor, setHoveredColor] = useState<string>();

  const previewColor = hoveredColor || selectedColor;
  const previewColorName = COLORS.find(c => c.hex === previewColor)?.name;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-6">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Elige tu Color Personal
          </h2>
          <p className="text-gray-600">
            Tu color te identifica en el chat, reflejando tu personalidad y haciendo 
            la comunicación más personal y única. Como en una conversación real, 
            cada persona tiene su propia voz.
          </p>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2">Vista previa:</div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
              <MessageSquare className="w-4 h-4 text-gray-600" />
            </div>
            <div 
              className="flex-1 p-3 rounded-lg transition-colors duration-200"
              style={{ 
                backgroundColor: previewColor ? `${previewColor}15` : 'transparent',
                borderColor: previewColor,
                borderWidth: '1px'
              }}
            >
              <div className="font-medium mb-1" style={{ color: previewColor }}>
                Tú
              </div>
              <div className="text-gray-600">
                Cada mensaje tuyo tendrá este color, haciéndolo único y personal.
              </div>
            </div>
          </div>
        </div>

        {/* Color Grid */}
        <div>
          <div className="text-sm text-gray-600 mb-3">
            {previewColorName ? 
              `${previewColorName} - Un color que refleja tu esencia` : 
              "Selecciona el color que mejor te represente:"}
          </div>
          <div className="grid grid-cols-5 gap-4">
            {COLORS.map((color) => (
              <button
                key={color.hex}
                className={`w-12 h-12 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  selectedColor === color.hex ? "ring-2 ring-offset-2 scale-110" : ""
                }`}
                style={{ 
                  backgroundColor: color.hex,
                  transform: hoveredColor === color.hex ? "scale(1.1)" : "scale(1)"
                }}
                onClick={() => setSelectedColor(color.hex)}
                onMouseEnter={() => setHoveredColor(color.hex)}
                onMouseLeave={() => setHoveredColor(undefined)}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <Button
          className="w-full text-lg py-6"
          disabled={!selectedColor}
          onClick={() => selectedColor && onColorSelected(selectedColor)}
        >
          {selectedColor ? "Comenzar a Chatear" : "Elige un color para comenzar"}
        </Button>
      </CardContent>
    </Card>
  );
}