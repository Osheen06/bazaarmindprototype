import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

// Core Product Pages
import Landing from "./pages/Landing";
import MarketPulse from "./pages/MarketPulse";
import MarketNetwork from "./pages/MarketNetwork";
import Shop from "./pages/Shop";
import Vendor from "./pages/Vendor";
import Ask from "./pages/Ask";

// Master Modules & Secondary Working Features
import MandiIntelligence from "./pages/MandiIntelligence";
import WeeklyMarkets from "./pages/WeeklyMarkets";
import SeasonalWastage from "./pages/SeasonalWastage";
import ExoticHeatmap from "./pages/ExoticHeatmap";
import CaseStudies from "./pages/CaseStudies";
import WhatsAppChannel from "./pages/WhatsAppChannel";
import PilotOnboard from "./pages/PilotOnboard";
import PilotBusiness from "./pages/PilotBusiness";
import More from "./pages/More";
import VendorLoan from "./pages/VendorLoan";

const withShell = (el) => <Layout>{el}</Layout>;

export default function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              {/* Core Landing & Daily Intelligence */}
              <Route path="/" element={<Landing />} />
              <Route path="/pulse" element={withShell(<MarketPulse />)} />
              <Route path="/network" element={withShell(<MarketNetwork />)} />
              <Route path="/shop" element={withShell(<Shop />)} />
              <Route path="/vendor" element={withShell(<Vendor />)} />
              <Route path="/ask" element={withShell(<Ask />)} />

              {/* Master Working Modules */}
              <Route path="/mandi" element={withShell(<MandiIntelligence />)} />
              <Route path="/directory" element={withShell(<WeeklyMarkets />)} />
              <Route path="/weekly-markets" element={withShell(<WeeklyMarkets />)} />
              <Route path="/seasonality" element={withShell(<SeasonalWastage />)} />
              <Route path="/wastage" element={withShell(<SeasonalWastage />)} />
              <Route path="/heatmap" element={withShell(<ExoticHeatmap />)} />
              <Route path="/casestudies" element={withShell(<CaseStudies />)} />
              <Route path="/whatsapp" element={withShell(<WhatsAppChannel />)} />
              <Route path="/join" element={withShell(<PilotOnboard />)} />
              <Route path="/onboard" element={withShell(<PilotOnboard />)} />
              <Route path="/business" element={withShell(<PilotBusiness />)} />
              <Route path="/roadmap" element={withShell(<PilotBusiness />)} />

              {/* Clearly Labelled Future Architecture */}
              <Route path="/loans" element={withShell(<VendorLoan />)} />
              <Route path="/finance" element={withShell(<VendorLoan />)} />

              {/* Settings & Exploration */}
              <Route path="/more" element={withShell(<More />)} />
            </Routes>
            <Toaster position="top-center" richColors />
          </BrowserRouter>
        </AppProvider>
      </ErrorBoundary>
    </div>
  );
}
