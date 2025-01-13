import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface AppBarProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function AppBar({ showBackButton, onBackClick }: AppBarProps) {
  const [, setLocation] = useLocation();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={handleBackClick}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            RealtimeChat
          </h1>
        </div>
      </div>
    </div>
  );
}
