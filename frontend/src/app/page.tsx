"use client";

import React, { useState } from "react";
import { TopBar, BottomNav, SideDrawer } from "@/components/Navigation";
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navigate = (screen: string) => {
    setActiveScreen(screen);
    // Scroll to top when changing screens
    window.scrollTo(0, 0);
  };

  const currentScreenTitle = () => {
    switch (activeScreen) {
      case "home":
      case "splash": // no top bar in splash
        return "";
      case "my-farm":
        return "Farm Overview";
      case "ai-advisor":
        return "AI Advisor";
      case "community":
        return "Community";
      case "weather":
        return "Weather Forecast";
      case "crop-health":
        return "Crop Health";
      case "soil-health":
        return "Soil Health";
      case "fertilizer-advisor":
        return "Fertilizer Advisor";
      case "irrigation-advisor":
        return "Irrigation Advisor";
      case "pest-detection":
        return "Pest Detection";
      case "market-prices":
        return "Market Prices";
      case "iot-dashboard":
        return "IoT Dashboard";
      case "alerts":
        return "Alerts & Notifications";
      default:
        return "";
    }
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case "splash":
        return <ScreenSplash navigate={navigate} />;
      case "home":
        return <ScreenHome navigate={navigate} />;
      case "ai-advisor":
        return <ScreenAiAdvisor navigate={navigate} />;
      case "my-farm":
      case "soil-health":
      case "irrigation-advisor":
      case "pest-detection":
        return <ScreenMyFarm />;
      case "community":
        return <ScreenCommunity />;
      case "iot-dashboard":
        return <ScreenIotDashboard />;
      case "market-prices":
        return <ScreenMarketPrices navigate={navigate} />;
      case "alerts":
        return <ScreenAlerts />;
      case "weather":
        return <ScreenWeather />;
      case "crop-health":
        return <ScreenCropHealth />;
      case "fertilizer-advisor":
        return <ScreenFertilizerAdvisor />;
      default:
        return <ScreenHome navigate={navigate} />;
    }
  };

  if (activeScreen === "splash") {
    return <ScreenSplash navigate={navigate} />;
  }

  return (
    <div className="app-container flex flex-col bg-slate-50 overflow-hidden relative">
      <TopBar 
        onMenuClick={() => setIsDrawerOpen(true)} 
        title={currentScreenTitle()} 
      />
      
      <div className="flex-1 overflow-hidden relative isolate z-0">
         {renderScreen()}
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
