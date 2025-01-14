import { useState } from "react";
import { NameInput } from "./NameInput";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FeatureIcons } from "./FeatureIcons";
import { motion } from "framer-motion";

interface WelcomeScreenProps {
  onNameSubmit: (name: string) => void;
}

export function WelcomeScreen({ onNameSubmit }: WelcomeScreenProps) {
  const [showDetails, setShowDetails] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const detailsVariants = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div 
      className="w-full space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-3xl font-bold">¡Bienvenido a RealtimeChat!</h2>
            <p className="text-gray-600">
              Conecta y chatea con otros usuarios en tiempo real
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <FeatureIcons />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <NameInput onNameSubmit={onNameSubmit} />

              <Button
                variant="ghost"
                className="w-full mt-4 text-gray-600"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Ocultar detalles
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Ver más detalles
                  </>
                )}
              </Button>

              <motion.div
                variants={detailsVariants}
                initial="hidden"
                animate={showDetails ? "show" : "hidden"}
              >
                <div className="mt-4 space-y-4 text-gray-600">
                  <div>
                    <h3 className="font-semibold mb-2">¿Cómo funciona?</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Ingresa tu nombre para identificarte en el chat</li>
                      <li>Elige un color para personalizar tus mensajes</li>
                      <li>Crea una nueva sala o únete a una existente</li>
                      <li>Comparte el enlace de la sala con otros usuarios</li>
                      <li>¡Comienza a chatear!</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Características</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>Visualización de escritura en tiempo real</li>
                      <li>Sistema de turnos para evitar superposiciones</li>
                      <li>Indicadores de estado de los usuarios</li>
                      <li>Notificaciones de entrada y salida</li>
                      <li>Interfaz intuitiva y responsive</li>
                      <li>Diseño eco-consciente y eficiente</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}