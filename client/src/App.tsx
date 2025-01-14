import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { ColorPicker } from "@/components/chat/ColorPicker";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureIcons } from "@/components/chat/FeatureIcons";
import { AppBar } from "@/components/AppBar";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8);
}

function App() {
  const [userColor, setUserColor] = useState<string>(() =>
    localStorage.getItem("userColor") || ""
  );
  const [userName, setUserName] = useState<string>(() =>
    localStorage.getItem("userName") || ""
  );
  const [, setLocation] = useLocation();

  const handleColorSelected = (color: string) => {
    setUserColor(color);
    localStorage.setItem("userColor", color);
    setLocation(`/room/${generateRoomId()}`);
  };

  const handleColorChange = (newColor: string) => {
    setUserColor(newColor);
    localStorage.setItem("userColor", newColor);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100/50">
      <Switch>
        <Route path="/">
          <>
            <AppBar />
            <main className="flex-1 p-4 md:p-6 container mx-auto">
              {!userName ? (
                <WelcomeScreen onNameSubmit={setUserName} />
              ) : !userColor ? (
                <div className="flex items-center justify-center">
                  <ColorPicker onColorSelected={handleColorSelected} />
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="w-full max-w-2xl space-y-8">
                    <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-lg">
                      <CardContent className="p-8 text-center space-y-6">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          RealtimeChat: Comunicación Consciente
                        </h2>
                        <p className="text-gray-600 max-w-lg mx-auto text-base leading-relaxed">
                          Experimenta una forma de comunicación más natural y sostenible.
                          Sin bases de datos permanentes, reducimos el consumo energético
                          y las emisiones de CO2, mientras mantenemos tus conversaciones
                          privadas y efímeras como las palabras al viento.
                        </p>
                      </CardContent>
                    </Card>

                    <FeatureIcons />

                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-8">
                        <Button
                          className="w-full h-14 text-lg font-semibold transition-all duration-200
                            bg-gradient-to-r from-primary to-primary/90
                            hover:scale-[1.02] active:scale-[0.98]
                            shadow-lg hover:shadow-xl
                            hover:from-primary/90 hover:to-primary
                            rounded-lg"
                          onClick={() => setLocation(`/room/${generateRoomId()}`)}
                        >
                          Iniciar Nueva Conversación
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </main>
          </>
        </Route>
        <Route path="/room/:roomId">
          {params => userColor ? (
            <>
              <AppBar showBackButton />
              <main className="flex-1 p-4 md:p-6 container mx-auto">
                <div className="flex items-center justify-center">
                  <ChatRoom
                    userColor={userColor}
                    roomId={params.roomId}
                    userName={userName}
                    onColorChange={handleColorChange}
                  />
                </div>
              </main>
            </>
          ) : (
            <>
              <AppBar />
              <main className="flex-1 p-4 md:p-6 container mx-auto">
                <div className="flex items-center justify-center">
                  <ColorPicker onColorSelected={handleColorSelected} />
                </div>
              </main>
            </>
          )}
        </Route>
      </Switch>
    </div>
  );
}

export default App;