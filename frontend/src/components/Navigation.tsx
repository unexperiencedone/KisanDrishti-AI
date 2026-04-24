import React, { useState } from "react";
import {
  Menu,
  Bell,
  Home,
  Sprout,
  MessageSquare,
  Users,
  User,
  X,
  Sun,
  MapPin,
  CheckCircle,
  ThermometerSun,
  Droplet,
  CloudLightning,
  ChevronRight,
  LogOut,
  Settings,
  HelpCircle,
  Activity,
  LineChart,
  Target,
  ShoppingCart,
  Phone,
  BookOpen,
} from "lucide-react";


import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Top Bar Component
export function TopBar({
  onMenuClick,
  title,
  notificationCount = 3,
}: {
  onMenuClick: () => void;
  title?: string;
  notificationCount?: number;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-40 border-b border-slate-100 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1 -ml-1 hover:bg-slate-100 rounded-full text-slate-700 transition"
        >
          <Menu className="w-6 h-6" />
        </button>
        {title ? (
          <h1 className="text-lg font-bold text-slate-800">{title}</h1>
        ) : (
          <div className="flex items-center gap-2">
            <img
              src="/logo.jpeg"
              alt="Logo"
              className="w-8 h-8 rounded-full border border-slate-200"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <span className="font-exrabold text-emerald-800 font-bold tracking-tight text-lg">
              KisanDrishti <span className="text-amber-500">AI</span>
            </span>
          </div>
        )}
      </div>
      <button className="relative p-1 text-slate-700 hover:bg-slate-100 rounded-full transition">
        <Bell className="w-6 h-6" />
        {notificationCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        )}
      </button>
    </div>
  );
}

// Bottom Navigation Component
export function BottomNav({
  activeScreen,
  navigate,
}: {
  activeScreen: string;
  navigate: (screen: string) => void;
}) {
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "my-farm", icon: Sprout, label: "My Farm" },
    { id: "ai-advisor", icon: MessageSquare, label: "AI Advisor" },
    { id: "community", icon: Users, label: "Community" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="sticky bottom-0 z-40 bg-white border-t border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] w-full pb-safe">
      <div className="flex justify-between items-center px-6 py-2">
        {tabs.map((tab) => {
          const isActive = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center w-12 pt-1 pb-1 transition-all clickable",
                isActive ? "text-emerald-700" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-2xl mb-0.5 transition-all",
                  isActive ? "bg-emerald-50" : "bg-transparent"
                )}
              >
                <tab.icon
                  className={cn(
                    "w-6 h-6",
                    isActive ? "fill-emerald-700/20 stroke-emerald-700" : "stroke-current"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={cn(
                  "text-[10px]",
                  isActive ? "font-bold text-emerald-800" : "font-medium"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Drawer Component
export function SideDrawer({
  isOpen,
  onClose,
  navigate,
}: {
  isOpen: boolean;
  onClose: () => void;
  navigate: (screen: string) => void;
}) {
  const menuItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "my-farm", icon: Sprout, label: "My Farms" },
    { id: "weather", icon: Sun, label: "Weather Forecast" },
    { id: "crop-health", icon: Activity, label: "Crop Health" },
    { id: "soil-health", icon: Target, label: "Soil Health" },
    { id: "fertilizer-advisor", icon: CheckCircle, label: "Fertilizer Advisor" },
    { id: "irrigation-advisor", icon: Droplet, label: "Irrigation Advisor" },
    { id: "pest-detection", icon: ThermometerSun, label: "Pest Detection" },
    { id: "market-prices", icon: LineChart, label: "Market Prices" },
    { id: "iot-dashboard", icon: CloudLightning, label: "IoT Dashboard" },
    {
      id: "alerts",
      icon: Bell,
      label: "Alerts & Notifications",
      badge: "3",
      badgeColor: "bg-red-500",
    },
    { id: "knowledge", icon: BookOpen, label: "Knowledge Center" },
    { id: "community", icon: Users, label: "Community" },
    { id: "store", icon: ShoppingCart, label: "Agri Store" },
    { id: "settings", icon: Settings, label: "Settings" },
    { id: "help", icon: HelpCircle, label: "Help & Support" },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-emerald-900 z-50 shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 pb-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="Profile"
              className="w-12 h-12 rounded-full border-2 border-emerald-400 bg-white"
            />
            <div className="text-white">
              <h2 className="font-bold text-lg leading-tight text-white">Ramesh Kumar</h2>
              <p className="text-emerald-200 text-xs flex items-center gap-1">
                Farmer <MapPin className="w-3 h-3 ml-1 inline" /> Kanpur, UP
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    navigate(item.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 text-white/90 hover:text-white group transition"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-emerald-300 group-hover:text-emerald-400" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span
                        className={cn(
                          "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white",
                          item.badgeColor || "bg-emerald-600"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:text-emerald-400" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 border-t border-white/10">
          <button
            onClick={() => {
              navigate('splash');
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-white/20 rounded-xl text-white font-medium hover:bg-white/10 transition"
          >
            <LogOut className="w-5 h-5" /> Log Out
          </button>
        </div>
      </div>
    </>
  );
}
