import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, AlertTriangle, HelpCircle, Mic, MicOff, Check, Edit3, Sparkles, Navigation, MapPin, ExternalLink, Compass, ArrowRight, Store } from "lucide-react";
import { parseShoppingList, trackEvent, planShopperRoute, getGoogleMapsDirectionsUrl } from "../lib/api";
import { useApp } from "../context/AppContext";
import { TypingDots } from "../components/Loading";
import { Chip } from "../components/atoms";

const SUGGESTIONS = [
  "Mujhe 2 kilo tamatar aur thoda dhaniya chahiye",
  "I need 2kg tomatoes, coriander and onions",
  "Aaj palak, aloo aur hari mirch chahiye",
];

export default function Shop() {
  const { marketId, setMarketId, currentMarket, refreshPulse, participant, dataSource } = useApp();
  const [messages, setMessages] = useState([
    {
      id: "intro",
      role: "assistant",
      type: "text",
      text: "नमस्ते! आपको क्या चाहिए? / What do you need today?\n\nTell BazaarMind naturally in Hindi, Hinglish, or English. Gemini converts your need into structured demand signals for your local market without invading your privacy.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    trackEvent("shop_opened");
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "hi-IN";
      rec.onresult = (e) => {
        const transcript = e.results[0]?.[0]?.transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not available on this browser. You can type in Hindi, Hinglish, or English.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSend = async (textToSend) => {
    const value = (textToSend ?? input).trim();
    if (!value || busy) return;
    setInput("");
    const userMsgId = `user-${Date.now()}`;
    setMessages((m) => [...m, { id: userMsgId, role: "user", type: "text", text: value }]);
    setBusy(true);
    trackEvent("shopping_list_parse_requested");

    try {
      // Step 1: Parse without persisting yet (Structured Demand Confirmation Step)
      const res = await parseShoppingList(value, marketId, participant?.id, false);
      if (!res.ok || !res.items?.length) {
        setMessages((m) => [
          ...m,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            type: "text",
            text: res.error || "BazaarMind couldn't identify specific produce in that message. Try saying: 'Mujhe 2 kilo tamatar chahiye'.",
          },
        ]);
      } else {
        // Show structured demand signals for confirmation
        setMessages((m) => [
          ...m,
          {
            id: `confirm-${Date.now()}`,
            role: "assistant",
            type: "confirmation",
            rawText: value,
            items: res.items,
            language: res.language || "HINGLISH",
            resData: res,
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          type: "text",
          text: "Connection lost. Please check your network and try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const confirmDemandSignal = async (confirmMsgId, rawText) => {
    setBusy(true);
    try {
      // Step 2: Persist the confirmed demand signals
      const res = await parseShoppingList(rawText, marketId, participant?.id, true);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === confirmMsgId
            ? {
                ...msg,
                type: "list",
                data: res,
                confirmed: true,
              }
            : msg
        )
      );
      refreshPulse();
      trackEvent("shopping_list_confirmed");
    } catch {
      alert("Failed to save demand signal. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const editDemandSignal = (confirmMsgId, rawText) => {
    setInput(rawText);
    setMessages((prev) => prev.filter((m) => m.id !== confirmMsgId));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-190px)] md:h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E5DEC9]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-[#1E2022]">Shopper</h1>
            <span className="text-sm font-hindi text-[#5C6360]">/ खरीदार</span>
          </div>
          <p className="text-xs text-[#5C6360]">
            BazaarMind · Interprets natural needs into anonymous local demand
          </p>
        </div>
        <Chip tone="green">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[#1E5631]" />
            Natural Demand
          </span>
        </Chip>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bm-scroll mt-3 pr-1 flex flex-col gap-3 py-2">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            if (m.type === "confirmation") {
              return (
                <DemandConfirmationCard
                  key={m.id}
                  items={m.items}
                  rawText={m.rawText}
                  language={m.language}
                  busy={busy}
                  onConfirm={() => confirmDemandSignal(m.id, m.rawText)}
                  onEdit={() => editDemandSignal(m.id, m.rawText)}
                />
              );
            }
            if (m.type === "list") {
              return <ListResult key={m.id} data={m.data} marketId={marketId} dataSource={dataSource} />;
            }
            return (
              <Bubble key={m.id} role={m.role}>
                {m.text}
              </Bubble>
            );
          })}
        </AnimatePresence>

        {busy && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="self-start bg-[#F7F4EE] border border-[#E5DEC9] rounded-2xl rounded-tl-none px-4 py-3"
          >
            <TypingDots />
          </motion.div>
        )}
      </div>

      {/* Suggested prompts if only intro is visible */}
      {messages.length <= 1 && (
        <div className="flex gap-2 flex-wrap mt-2 mb-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-xs rounded-full border border-[#E5DEC9] bg-white px-3 py-1.5 text-[#3A403D] hover:bg-[#F7F4EE] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleListening}
          className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 border transition-all ${
            isListening
              ? "bg-red-500 text-white border-red-600 animate-pulse ring-4 ring-red-200"
              : "bg-white text-[#3A403D] border-[#E5DEC9] hover:bg-[#F7F4EE]"
          }`}
          title={isListening ? "Listening... click to stop" : "Speak your shopping list"}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        <input
          data-testid="shopper-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="आपको क्या चाहिए? e.g. Mujhe 2 kilo tamatar aur thoda dhaniya chahiye…"
          className="flex-1 rounded-full border border-[#E5DEC9] bg-white px-4 py-3 text-sm outline-none focus:border-[#1E5631] focus:ring-2 focus:ring-[#1E5631]/15"
        />

        <button
          data-testid="shopper-send-button"
          onClick={() => handleSend()}
          disabled={busy || !input.trim()}
          className="h-11 w-11 rounded-full bg-[#1E5631] text-[#FDFBF7] flex items-center justify-center hover:bg-[#194727] disabled:opacity-40 transition-colors shrink-0"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function Bubble({ role, children }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
        isUser
          ? "self-end bg-[#2D6A4F] text-white rounded-2xl rounded-tr-none"
          : "self-start bg-[#F7F4EE] border border-[#E5DEC9] text-[#1E2022] rounded-2xl rounded-tl-none"
      }`}
    >
      {children}
    </motion.div>
  );
}

function DemandConfirmationCard({ items, rawText, language, busy, onConfirm, onEdit }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="self-start max-w-[92%] w-full bg-white border-2 border-[#1E5631]/30 rounded-2xl rounded-tl-none p-4 shadow-md"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F0EBDE]">
        <div className="text-xs font-bold uppercase tracking-wider text-[#1E5631]">
          मैंने समझा / Gemini Extracted Signals
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F7F4EE] text-[#5C6360] font-mono">
          {language}
        </span>
      </div>

      <div className="text-xs text-[#5C6360] mb-3 italic">
        "{rawText}"
      </div>

      <div className="space-y-2 mb-4">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl px-3 py-2 text-sm"
          >
            <div>
              <span className="font-semibold text-[#1E2022]">Product: {it.product}</span>
              <div className="text-xs text-[#5C6360]">
                Quantity: <span className="font-medium text-[#1E2022]">{it.quantity || "unspecified"}</span>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#1E5631]/10 text-[#1E5631] uppercase tracking-wide">
              Signal: DEMAND
            </span>
          </div>
        ))}
      </div>

      <div className="text-xs text-[#5C6360] mb-3">
        Does this accurately represent what you're looking for? Confirming creates an anonymous demand signal for this market.
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onConfirm}
          disabled={busy}
          className="flex-1 py-2 px-3 rounded-xl bg-[#1E5631] text-white font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-[#194727] disabled:opacity-50 transition-colors shadow-sm"
        >
          <Check className="h-4 w-4" />
          ✓ सही है / Confirm Demand
        </button>
        <button
          onClick={onEdit}
          disabled={busy}
          className="py-2 px-3 rounded-xl border border-[#E5DEC9] text-[#3A403D] font-medium text-xs flex items-center justify-center gap-1 hover:bg-[#F7F4EE] disabled:opacity-50 transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5" />
          ✎ बदलें / Edit
        </button>
      </div>
    </motion.div>
  );
}

function ListResult({ data, marketId = "demo-ina", dataSource = "DEMO" }) {
  const [route, setRoute] = useState(null);
  const [planningRoute, setPlanningRoute] = useState(false);

  const handlePlanRoute = async () => {
    if (planningRoute) return;
    setPlanningRoute(true);
    try {
      const items = (data.items || []).map((i) => i.product);
      const res = await planShopperRoute({ items, marketId, dataSource });
      if (res && res.stops) {
        setRoute(res);
      }
    } catch {
      // Gracefully handled by client fallback
    } finally {
      setPlanningRoute(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="self-start max-w-[92%] w-full bg-white border border-[#E5DEC9] rounded-2xl rounded-tl-none p-4 shadow-sm space-y-4"
      data-testid="shopping-list-result"
    >
      <div className="flex items-center justify-between pb-1 border-b border-[#F0EBDE]">
        <div className="text-xs font-semibold tracking-wide uppercase text-[#5C6360]">
          Your list vs today's market pulse
        </div>
        <span className="text-[11px] font-medium text-[#1E5631] bg-[#1E5631]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Demand recorded
        </span>
      </div>

      <div className="flex flex-col divide-y divide-[#F0EBDE]">
        {data.items.map((it) => (
          <div key={it.product} className="flex items-center justify-between py-2.5 gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {it.status === "tight" ? (
                <AlertTriangle className="h-5 w-5 text-[#B4571E] shrink-0" />
              ) : it.status === "unknown" ? (
                <HelpCircle className="h-5 w-5 text-[#8A8A82] shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-[#1E5631] shrink-0" />
              )}
              <div className="min-w-0">
                <div className="font-semibold text-[#1E2022] text-sm">
                  {it.product}
                  {it.quantity ? (
                    <span className="text-[#8A8A82] font-normal"> · {it.quantity}</span>
                  ) : (
                    <span className="text-[#8A8A82] font-normal italic"> · unspecified</span>
                  )}
                </div>
                {it.known ? (
                  <div className="text-xs text-[#5C6360]">
                    {it.availability} availability · {it.demand} demand
                    {it.reportedPriceSignal ? ` · Observed: ${it.reportedPriceSignal}` : ""}
                  </div>
                ) : (
                  <div className="text-xs text-[#8A8A82]">Not enough signals for this item in this market yet.</div>
                )}
              </div>
            </div>
            {it.known && (
              <Chip tone={it.status === "tight" ? "orange" : "green"}>
                {it.status === "tight" ? "Tight" : "Available"}
              </Chip>
            )}
          </div>
        ))}
      </div>

      {data.summary && (
        <div className="rounded-xl bg-[#D96B27]/8 border border-[#D96B27]/20 px-3 py-2 text-sm text-[#B4571E] font-medium">
          {data.summary}
        </div>
      )}

      {/* Gemini Smart Walking Route Planner Section */}
      <div className="rounded-2xl bg-[#FDFBF7] border border-[#E5DEC9] p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1E5631]">
              <Sparkles className="h-3.5 w-3.5" />
              Gemini Market Walking Route
            </div>
            <p className="text-xs text-[#5C6360] mt-0.5">
              Sequence your stall stops: scarce items first, minimum walking distance, and Google Maps directions.
            </p>
          </div>

          <button
            onClick={handlePlanRoute}
            disabled={planningRoute}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1E5631] hover:bg-[#194727] text-white text-xs font-semibold px-3.5 py-2 transition-colors shrink-0 shadow-xs disabled:opacity-50"
          >
            <Compass className={`h-3.5 w-3.5 ${planningRoute ? "animate-spin" : ""}`} />
            <span>{planningRoute ? "Optimizing Route..." : route ? "Re-plan Route" : "✨ Plan Route with Gemini"}</span>
          </button>
        </div>

        {/* Route Steps Display */}
        {route && route.stops && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2 border-t border-[#E5DEC9] space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs font-medium text-[#1E2022] bg-white rounded-xl p-2.5 border border-[#E5DEC9]">
              <span className="text-[#1E5631] font-semibold">Budget: {route.estimatedBudget || "₹160–₹190"}</span>
              <span className="text-[#5C6360]">{route.estimatedWalkingTime || "~3 mins walking"}</span>
            </div>

            <div className="space-y-2">
              {route.stops.map((stop) => (
                <div
                  key={stop.step}
                  className="rounded-xl bg-white border border-[#E5DEC9] p-2.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#1E2022]">
                      <span className="h-5 w-5 rounded-full bg-[#1E5631] text-white text-[11px] flex items-center justify-center font-mono">
                        {stop.step}
                      </span>
                      {stop.stallName} · {stop.vendorName}
                    </span>
                    <a
                      href={stop.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#1E5631] bg-[#EAF4ED] hover:bg-[#D8ECD8] px-2 py-0.5 rounded-full transition-colors"
                    >
                      <Navigation className="h-2.5 w-2.5" />
                      <span>Directions</span>
                      <ExternalLink className="h-2 w-2 opacity-60" />
                    </a>
                  </div>

                  <div className="text-[11.5px] text-[#3A403D] pl-6">
                    <span className="font-semibold text-[#1E5631]">{stop.product}</span>
                    {stop.estimatedPrice ? ` (${stop.estimatedPrice})` : ""} — {stop.reason}
                  </div>
                </div>
              ))}
            </div>

            {/* Master Google Maps Route Button */}
            {route.googleMapsRouteUrl && (
              <a
                href={route.googleMapsRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E5631] hover:bg-[#194727] text-white text-xs font-semibold py-2.5 shadow-sm transition-colors"
              >
                <Navigation className="h-4 w-4" />
                <span>Open Complete Walking Route in Google Maps</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            )}
          </motion.div>
        )}
      </div>

      <div className="pt-2 border-t border-[#F0EBDE] flex items-center justify-between text-[11px] text-[#8A8A82]">
        <span>Market Pulse updated with your signals</span>
        <span className="font-mono">Anonymous signal</span>
      </div>
    </motion.div>
  );
}
