import React from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  Activity,
  ShoppingBag,
  Store,
  Sparkles,
  Network,
  Banknote,
  Radio,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

import LocationMarketPicker from "./LocationMarketPicker";
import { useApp } from "../context/AppContext";

const MOBILE_NAV = [
  {
    to: "/pulse",
    label: "Pulse",
    icon: Activity,
    testid: "nav-item-pulse",
  },
  {
    to: "/shop",
    label: "Shop",
    icon: ShoppingBag,
    testid: "nav-item-shop",
  },
  {
    to: "/vendor",
    label: "Vendor",
    icon: Store,
    testid: "nav-item-vendor",
  },
  {
    to: "/mandi",
    label: "Mandi",
    icon: TrendingUp,
    testid: "nav-item-mandi",
  },
  {
    to: "/loans",
    label: "Loans",
    icon: Banknote,
    testid: "nav-item-loans",
  },
];

const SIDEBAR_NAV = [
  {
    to: "/pulse",
    label: "Market Pulse",
    icon: Activity,
    testid: "side-pulse",
  },
  {
    to: "/shop",
    label: "Shopper Assistant",
    icon: ShoppingBag,
    testid: "side-shop",
  },
  {
    to: "/vendor",
    label: "Vendor Sensor",
    icon: Store,
    testid: "side-vendor",
  },
  {
    to: "/mandi",
    label: "Mandi Arbitrage",
    icon: TrendingUp,
    testid: "side-mandi",
  },
  {
    to: "/loans",
    label: "Vendor Capital",
    icon: Banknote,
    testid: "side-loans",
  },
  {
    to: "/ask",
    label: "Ask BazaarMind",
    icon: Sparkles,
    testid: "side-ask",
  },
];

function LiveMarketBadge() {
  return (
    <div
      className="flex items-center gap-2"
      data-testid="live-market-indicator"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-[11px] font-bold text-emerald-800 shadow-2xs">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        LIVE INA BAZAAR
      </span>

      <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#1E5631]/8 border border-[#1E5631]/20 px-2.5 py-1 text-[11px] font-semibold text-[#1E5631]">
        48 ACTIVE SENSORS
      </span>
    </div>
  );
}

function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-9 w-9 rounded-xl bg-[#1E5631] flex items-center justify-center shadow-sm">
        <Network className="h-5 w-5 text-[#FDFBF7]" />
      </div>

      {!compact && (
        <div className="leading-tight">
          <div className="font-display font-extrabold text-[#1E2022] tracking-tight">
            BazaarMind
          </div>

          <div className="text-[10px] tracking-[0.16em] uppercase text-[#5C6360]">
            Delhi NCR Intelligence
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    currentMarket,
  } = useApp();

  return (
    <div className="min-h-screen bg-[#FDFBF7] bm-noise">
      <div className="flex">

        {/* =====================================================
            DESKTOP SIDEBAR
        ====================================================== */}

        <aside className="hidden md:flex flex-col w-64 bg-[#F7F4EE] border-r border-[#E5DEC9] min-h-screen p-4 sticky top-0 h-screen overflow-y-auto">

          <button
            onClick={() => navigate("/")}
            className="mb-6 mt-1 text-left"
            data-testid="sidebar-logo"
          >
            <Logo />
          </button>

          <nav className="flex flex-col gap-1">
            {SIDEBAR_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                data-testid={item.testid}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#1E5631] text-[#FDFBF7]"
                      : "text-[#3A403D] hover:bg-[#EFE9DA]"
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Current market in sidebar */}

          <div className="mt-auto pt-4 border-t border-[#E5DEC9]">
            <div className="text-[11px] text-[#5C6360] mb-2">
              Current market
            </div>

            <div className="rounded-xl bg-white border border-[#E5DEC9] px-3 py-2.5">
              <div className="font-semibold text-sm text-[#1E2022]">
                {currentMarket?.name ||
                  "INA Market · South Delhi"}
              </div>

              <div className="text-[11px] text-[#8A8A82]">
                {currentMarket?.area ||
                  "Aurobindo Marg · 48 Active Sensors"}
              </div>
            </div>
          </div>
        </aside>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <div className="flex-1 min-w-0 flex flex-col min-h-screen">

          {/* =================================================
              TOP BAR
          ================================================== */}

          <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E5DEC9]">
            <div className="flex items-center justify-between gap-3 px-4 md:px-8 py-3">

              {/* Mobile logo */}

              <div className="md:hidden">
                <Logo compact />
              </div>

              {/* Desktop market title */}

              <div className="hidden md:block min-w-0">
                <div className="font-display font-semibold text-[#1E2022] truncate">
                  {currentMarket?.name ||
                    "INA Market · South Delhi"}
                </div>

                <div className="text-[11px] text-[#5C6360] truncate">
                  {currentMarket?.area ||
                    "South Delhi · Live Sensor Network"}
                </div>
              </div>

              {/* Right controls */}

              <div className="flex items-center gap-2 ml-auto">
                <LocationMarketPicker />
                <LiveMarketBadge />
              </div>
            </div>
          </header>

          {/* =================================================
              PAGE CONTENT
          ================================================== */}

          <main className="flex-1 px-4 md:px-8 py-5 md:py-8 pb-28 md:pb-10 max-w-5xl w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.28,
                }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
      ====================================================== */}

      <nav className="fixed bottom-0 inset-x-0 bg-[#FDFBF7]/95 backdrop-blur-md border-t border-[#E5DEC9] z-50 px-2 py-1.5 md:hidden flex justify-around items-center">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            data-testid={item.testid}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[56px] transition-colors ${
                isActive
                  ? "text-[#1E5631]"
                  : "text-[#8A8A82]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className="h-5 w-5"
                  strokeWidth={
                    isActive ? 2.4 : 2
                  }
                />

                <span className="text-[10px] font-semibold">
                  {item.label}
                </span>

                {isActive && (
                  <motion.span
                    layoutId="bm-tab"
                    className="absolute -top-1.5 h-1 w-6 rounded-full bg-[#1E5631]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function MoreLinkRow({
  to,
  icon: Icon,
  title,
  desc,
  testid,
}) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      data-testid={testid}
      className="w-full flex items-center gap-4 rounded-2xl bg-white border border-[#E5DEC9] px-4 py-4 text-left hover:shadow-md transition-shadow"
    >
      <div className="h-10 w-10 rounded-xl bg-[#1E5631]/8 flex items-center justify-center text-[#1E5631]">
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[#1E2022]">
          {title}
        </div>

        <div className="text-xs text-[#5C6360] truncate">
          {desc}
        </div>
      </div>

      <ChevronRight className="h-5 w-5 text-[#B8B2A0]" />
    </button>
  );
}