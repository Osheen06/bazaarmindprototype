import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, MapPin, ShieldCheck, ArrowRight, Store, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { askBazaar, trackEvent } from "../lib/api";
import { useApp } from "../context/AppContext";
import { TypingDots } from "../components/Loading";
import { Chip } from "../components/atoms";

const QUESTIONS = [
  "What's happening with tomatoes?",
  "What is running low in the market?",
  "टमाटर का क्या भाव चल रहा है आज?",
  "What is the observed price range for onions?",
  "Do we have enough signals to say tomatoes are scarce?",
  "What are shoppers asking for today?",
];

export default function Ask() {
  const { marketId, dataSource, currentMarket, setMarketId } = useApp();

  const [messages, setMessages] = useState([
    {
      id: "intro",
      role: "assistant",
      text: "Namaste! I am BazaarMind's evidence assistant. I answer questions strictly from the local signals currently recorded in your market.\n\nI will never invent prices, claim official rates, or answer off-topic questions.",
      totalSignals: null,
      freshness: "Grounded strictly in local evidence",
    },
  ]);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    trackEvent("ask_bazaarmind_opened", { marketId, dataSource });
  }, [marketId, dataSource]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  const send = async (text) => {
    const value = (text ?? input).trim();
    if (!value || busy) return;

    setInput("");
    const userMsgId = `user-${Date.now()}`;
    setMessages((existing) => [
      ...existing,
      {
        id: userMsgId,
        role: "user",
        text: value,
      },
    ]);

    setBusy(true);
    trackEvent("ask_bazaarmind_used", { marketId, dataSource, question: value });

    try {
      const response = await askBazaar(value, marketId, dataSource);
      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((existing) => [
        ...existing,
        {
          id: assistantMsgId,
          role: "assistant",
          text: response.ok
            ? response.answer
            : response.error || "BazaarMind couldn't answer that right now.",
          live: response.live,
          totalSignals: response.totalSignals,
          vendorObservations: response.vendorObservations,
          shopperSignals: response.shopperSignals,
          freshness: response.freshness || "Active today",
        },
      ]);
    } catch {
      setMessages((existing) => [
        ...existing,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: "BazaarMind couldn't connect to the local intelligence service. Please check your connection and try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-190px)] md:h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#E5DEC9]">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-[#1E2022]">Ask BazaarMind</h1>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#5C6360]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#1E5631]" />
            <span className="truncate font-medium">{currentMarket?.name || "INA MARKET — BAZAARMIND DEMO"}</span>
            <span>·</span>
            <span>Evidence-grounded only</span>
          </div>
        </div>

        <Chip tone="green">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1E5631]" />
            Zero Hallucination
          </span>
        </Chip>
      </div>

      {/* Market Mode Banner */}
      <div className="mt-2.5 rounded-xl bg-[#F7F4EE] border border-[#E5DEC9] px-3.5 py-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1E2022]">Grounding Source:</span>
            <span className="text-[#5C6360]">
              {marketId === "demo-ina"
                ? "INA Market Demo Signals (11 items · 4 stalls)"
                : dataSource === "PILOT"
                ? "Live pilot market signals"
                : `${currentMarket?.name || "Selected market"} (discovery signals only)`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {marketId !== "demo-ina" && (
              <button
                onClick={() => setMarketId("demo-ina")}
                className="text-[11px] font-bold text-[#1E5631] bg-[#EAF4ED] px-2.5 py-1 rounded-full hover:bg-[#D8ECD8] transition-colors flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-[#D96B27]" />
                Switch to INA Demo
              </button>
            )}
            <Link
              to="/pulse"
              className="text-[11px] font-medium text-[#1E5631] hover:underline flex items-center gap-1"
            >
              View Market Pulse <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bm-scroll mt-3 pr-1 flex flex-col gap-3 py-2"
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`max-w-[90%] px-4 py-3.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                message.role === "user"
                  ? "self-end bg-[#2D6A4F] text-white rounded-2xl rounded-tr-none"
                  : "self-start bg-white border border-[#E5DEC9] text-[#1E2022] rounded-2xl rounded-tl-none"
              }`}
              data-testid={message.role === "assistant" ? "ask-answer" : undefined}
            >
              {message.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#F0EBDE]">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1E5631] uppercase tracking-wider">
                    <Sparkles className="h-3 w-3" />
                    BazaarMind Intelligence
                  </span>
                  {message.freshness && (
                    <span className="text-[10px] text-[#8A8A82] ml-auto">
                      {message.freshness}
                    </span>
                  )}
                </div>
              )}

              <div className="text-[13.5px] leading-relaxed text-[#1E2022]">
                {message.text}
              </div>

              {/* Evidence Attribution Card if assistant response has evidence counts */}
              {message.role === "assistant" && (message.totalSignals != null || message.vendorObservations != null) && (
                <div className="mt-3 pt-2 border-t border-[#F0EBDE] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[#5C6360]">
                    {message.vendorObservations != null && (
                      <span className="inline-flex items-center gap-1 bg-[#F7F4EE] px-2 py-0.5 rounded-md font-mono text-[11px]">
                        <Store className="h-3 w-3 text-[#1E5631]" />
                        {message.vendorObservations} vendor obs
                      </span>
                    )}
                    {message.shopperSignals != null && (
                      <span className="inline-flex items-center gap-1 bg-[#F7F4EE] px-2 py-0.5 rounded-md font-mono text-[11px]">
                        <ShoppingBag className="h-3 w-3 text-[#2D6A4F]" />
                        {message.shopperSignals} shopper signals
                      </span>
                    )}
                  </div>

                  <Link
                    to="/pulse"
                    className="text-[11px] font-semibold text-[#1E5631] hover:underline flex items-center gap-1 ml-auto"
                  >
                    Inspect evidence signals <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {busy && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="self-start bg-white border border-[#E5DEC9] rounded-2xl rounded-tl-none px-4 py-3"
          >
            <TypingDots />
          </motion.div>
        )}
      </div>

      {/* Suggested Questions */}
      <div className="flex gap-2 flex-wrap mt-2 mb-1">
        {QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => send(question)}
            disabled={busy}
            className="text-xs rounded-full border border-[#E5DEC9] bg-white px-3 py-1.5 text-[#3A403D] hover:bg-[#F7F4EE] disabled:opacity-50 transition-colors"
          >
            {question}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="mt-1 flex items-center gap-2">
        <input
          data-testid="ask-gemini-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          disabled={busy}
          placeholder="Ask about availability, observed prices, or vendor reports…"
          className="flex-1 rounded-full border border-[#E5DEC9] bg-white px-4 py-3 text-sm outline-none focus:border-[#1E5631] focus:ring-2 focus:ring-[#1E5631]/15 disabled:bg-[#F7F4EE]"
        />

        <button
          data-testid="ask-send-button"
          onClick={() => send()}
          disabled={busy || !input.trim()}
          className="h-11 w-11 shrink-0 rounded-full bg-[#1E5631] text-[#FDFBF7] flex items-center justify-center hover:bg-[#194727] disabled:opacity-40 transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}