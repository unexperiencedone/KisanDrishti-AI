"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar, BottomNav, SideDrawer } from "@/components/Navigation";
import { cn } from "@/lib/utils";
import ScreenSplash from "@/components/ScreenSplash";
import ScreenHome from "@/components/ScreenHome";
import ScreenAiAdvisor from "@/components/ScreenAiAdvisor";
import ScreenMyFarm from "@/components/ScreenMyFarm";
import ScreenCommunity from "@/components/ScreenCommunity";
import ScreenIotDashboard from "@/components/ScreenIotDashboard";
import ScreenMarketPrices from "@/components/ScreenMarketPrices";
import ScreenAlerts from "@/components/ScreenAlerts";
import ScreenWeather from "@/components/ScreenWeather";
import ScreenCropHealth from "@/components/ScreenCropHealth";
import ScreenFertilizerAdvisor from "@/components/ScreenFertilizerAdvisor";

export default function MobileAppOrchestrator() {
  const [activeScreen, setActiveScreen] = useState("splash");
  const [history, setHistory] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Set initial screen
  useEffect(() => {
    if (activeScreen === "splash") {
      // Splash screen logic...
    }
  }, []);

  const navigate = (screen: string) => {
    if (screen === activeScreen) return;
    setHistory(prev => [...prev, activeScreen]);
    setActiveScreen(screen);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(prevStack => prevStack.slice(0, -1));
      setActiveScreen(prev);
    }
  };

  const currentScreenTitle = () => {
    switch (activeScreen) {
      case "home": return "";
      case "my-farm": return "खेत का अवलोकन";
      case "ai-advisor": return "AI सलाहकार";
      case "community": return "समुदाय";
      case "weather": return "मौसम का पूर्वानुमान";
      case "crop-health": return "फसल स्वास्थ्य";
      case "fertilizer-advisor": return "उर्वरक सलाहकार";
      case "market-prices": return "मंडी भाव";
      case "iot-dashboard": return "IoT डैशबोर्ड";
      case "alerts": return "अलर्ट";
      default: return "";
    }
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case "home": return <ScreenHome navigate={navigate} />;
      case "ai-advisor": return <ScreenAiAdvisor navigate={navigate} />;
      case "my-farm": return <ScreenMyFarm />;
      case "community": return <ScreenCommunity />;
      case "iot-dashboard": return <ScreenIotDashboard />;
      case "market-prices": return <ScreenMarketPrices navigate={navigate} />;
      case "alerts": return <ScreenAlerts />;
      case "weather": return <ScreenWeather />;
      case "crop-health": return <ScreenCropHealth />;
      case "fertilizer-advisor": return <ScreenFertilizerAdvisor />;
      default: return <ScreenHome navigate={navigate} />;
    }
  };

  if (activeScreen === "splash") {
    return <ScreenSplash navigate={navigate} />;
  }

  return (
    <div className="app-container flex flex-col bg-slate-50 overflow-hidden relative select-none">
      <TopBar 
        onMenuClick={() => setIsDrawerOpen(true)} 
        title={currentScreenTitle()} 
        onBack={history.length > 0 ? goBack : undefined}
      />
      
      {/* Main Screen Container with Gesture Support */}
      <div className="flex-1 overflow-hidden relative isolate z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100 && history.length > 0) {
                goBack();
              }
            }}
            className={cn(
              "w-full h-full absolute inset-0 overflow-x-hidden scroll-smooth",
              activeScreen === "ai-advisor" ? "overflow-hidden pt-12 pb-0" : "overflow-y-auto pt-12 pb-4"
            )}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav activeScreen={activeScreen} navigate={navigate} />

      <SideDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        navigate={navigate}
      />
    </div>
  );
}
