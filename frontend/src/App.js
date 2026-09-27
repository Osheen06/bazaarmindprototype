import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import MarketPulse from "./pages/MarketPulse";
import MarketNetwork from "./pages/MarketNetwork";
import Shop from "./pages/Shop";
import Vendor from "./pages/Vendor";
import Ask from "./pages/Ask";
import MandiIntelligence from "./pages/MandiIntelligence";
import VendorLoan from "./pages/VendorLoan";

const withShell = (el) => <Layout>{el}</Layout>;

export default function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <AppProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/pulse" element={withShell(<MarketPulse />)} />
            <Route path="/network" element={withShell(<MarketNetwork />)} />
            <Route path="/shop" element={withShell(<Shop />)} />
            <Route path="/vendor" element={withShell(<Vendor />)} />
            <Route path="/ask" element={withShell(<Ask />)} />
            <Route path="/mandi" element={withShell(<MandiIntelligence />)} />
            <Route path="/loans" element={withShell(<VendorLoan />)} />
            <Route path="/business" element={withShell(<VendorLoan />)} />
            <Route path="/more" element={withShell(<VendorLoan />)} />
            <Route path="/directory" element={withShell(<MandiIntelligence />)} />
            <Route path="/seasonality" element={withShell(<MarketPulse />)} />
            <Route path="/heatmap" element={withShell(<MarketPulse />)} />
            <Route path="/casestudies" element={withShell(<MarketPulse />)} />
            <Route path="/whatsapp" element={withShell(<Vendor />)} />
            <Route path="/join" element={withShell(<Vendor />)} />
          </Routes>
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  </div>
  );
}
