import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface Color {
  hex: string;
  name: string;
}

const COLORS: Color[] = [
  { hex: "#ef4444", name: "Rojo Energético" },
  { hex: "#f97316", name: "Naranja Vibrante" },
  { hex: "#f59e0b", name: "Ámbar Cálido" },
  { hex: "#84cc16", name: "Lima Fresco" },
  { hex: "#22c55e", name: "Verde Naturaleza" },
  { hex: "#06b6d4", name: "Cian Océano" },
  { hex: "#3b82f6", name: "Azul Cielo" },
  { hex: "#6366f1", name: "Índigo Real" },
  { hex: "#a855f7", name: "Púrpura Místico" },
  { hex: "#ec4899", name: "Rosa Sunset" },
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
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Personaliza tu Experiencia</h2>
          <p className="text-gray-600">
            Elige un color que refleje tu personalidad. Este color identificará tus mensajes en el chat.
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
                ¡Hola! Este es un ejemplo de cómo se verán tus mensajes.
              </div>
            </div>
          </div>
        </div>

        {/* Color Grid */}
        <div>
          <div className="text-sm text-gray-600 mb-3">
            {previewColorName || "Selecciona un color:"}
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
          {selectedColor ? "Continuar" : "Elige un color para continuar"}
        </Button>
      </CardContent>
    </Card>
  );
}