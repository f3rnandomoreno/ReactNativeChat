import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare, Leaf } from "lucide-react";

export function FeatureIcons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
          <h3 className="font-semibold">Salas Privadas</h3>
          <p className="text-sm text-gray-600">Crea o únete a salas privadas</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-indigo-500" />
          <h3 className="font-semibold">Tiempo Real</h3>
          <p className="text-sm text-gray-600">Ve la escritura en tiempo real</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Leaf className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <h3 className="font-semibold">Eco-Friendly</h3>
          <p className="text-sm text-gray-600">Mínimo impacto ambiental</p>
        </CardContent>
      </Card>
    </div>
  );
}
