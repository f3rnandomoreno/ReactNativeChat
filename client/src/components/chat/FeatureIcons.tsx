import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Leaf, Brain, Lock, Clock } from "lucide-react";

export function FeatureIcons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-6 text-center space-y-2">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 text-blue-500" />
          <h3 className="font-semibold text-lg">Comunicación Natural</h3>
          <p className="text-sm text-gray-600">
            Ve cada letra en tiempo real, como en una conversación cara a cara
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="p-6 text-center space-y-2">
          <Leaf className="h-10 w-10 mx-auto mb-3 text-green-500" />
          <h3 className="font-semibold text-lg">Eco-Friendly</h3>
          <p className="text-sm text-gray-600">
            Ahorramos recursos al mantener solo el mensaje actual
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-6 text-center space-y-2">
          <Brain className="h-10 w-10 mx-auto mb-3 text-purple-500" />
          <h3 className="font-semibold text-lg">Mejora la Atención</h3>
          <p className="text-sm text-gray-600">
            Escucha y comprende mejor centrándote en un mensaje a la vez
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
        <CardContent className="p-6 text-center space-y-2">
          <Clock className="h-10 w-10 mx-auto mb-3 text-amber-500" />
          <h3 className="font-semibold text-lg">Tiempo Real</h3>
          <p className="text-sm text-gray-600">
            Siente la presencia del otro en cada palabra escrita
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-50 to-rose-50">
        <CardContent className="p-6 text-center space-y-2">
          <Lock className="h-10 w-10 mx-auto mb-3 text-red-500" />
          <h3 className="font-semibold text-lg">Privacidad Total</h3>
          <p className="text-sm text-gray-600">
            Los mensajes se borran al instante, como palabras al viento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}