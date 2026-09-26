import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Mic, Camera, Type, Send, Store, TrendingUp, Check, Edit3, X, Sparkles, RefreshCw, Zap
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "../components/ui/dialog";
import { interpretSignal, createSignal, getVendorDemand, listSignals, transcribeAudio, trackEvent } from "../lib/api";
import { useApp } from "../context/AppContext";
import { ListeningLoader } from "../components/Loading";
import { Chip } from "../components/atoms";
import VendorLocationCard from "../components/VendorLocationCard";

const EXAMPLES = [
  "Aaj tamatar thoda kam aaya hai aur rate 70 rupaye hai",
  "Aloo ka stock pura hai, 25 rupaye rate",
  "आज धनिया बहुत कम आया है मंडी से",
  "Onions are plenty today at 35 per kg",
];

export default function Vendor() {
  const { marketId, refreshPulse, dataSource, participant } = useApp();
  const [vendorLocation, setVendorLocation] = useState(null);
  const [mode, setMode] = useState("voice");
  const [text, setText] = useState("");
  const [imageB64, setImageB64] = useState(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [demand, setDemand] = useState(null);
  const [recent, setRecent] = useState([]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");

  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileRef = useRef(null);

  const loadSide = useCallback(() => {
    getVendorDemand(marketId, dataSource).then(setDemand).catch(() => {});
    listSignals(marketId, null, dataSource).then((s) => setRecent(s.filter((x) => x.source === "VENDOR").slice(0, 6))).catch(() => {});
  }, [marketId, dataSource]);

  useEffect(() => {
    loadSide();
    trackEvent("vendor_home_viewed");
  }, [loadSide]);

  // Setup Web Speech Recognition for instant voice input in Hindi & English
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "hi-IN"; // Multilingual Delhi NCR speech
      rec.onresult = (e) => {
        const transcript = e.results[0]?.[0]?.transcript;
        if (transcript) {
          setText(transcript);
          doInterpret(transcript, null);
        }
        setRecording(false);
      };
      rec.onerror = () => setRecording(false);
      rec.onend = () => setRecording(false);
      recognitionRef.current = rec;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startVoice = async () => {
    if (recording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
      setRecording(false);
      return;
    }

    // Try browser SpeechRecognition first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setRecording(true);
        trackEvent("vendor_voice_started");
        return;
      } catch {}
    }

    // Fall back to MediaRecorder audio upload
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunksRef.current = [];
        const rec = new MediaRecorder(stream);
        rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
        rec.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setTranscribing(true);
          try {
            const res = await transcribeAudio(blob, "voice.webm");
            if (res.ok && res.transcript) {
              setText(res.transcript);
              doInterpret(res.transcript, null);
            } else {
              toast.error(res.error || "Could not transcribe audio.");
            }
          } catch {
            toast.error("Could not transcribe audio.");
          } finally {
            setTranscribing(false);
          }
        };
        recorderRef.current = rec;
        rec.start();
        setRecording(true);
        trackEvent("vendor_media_recorder_started");
      } catch {
        toast.error("Microphone permission denied.");
      }
    } else {
      toast.error("Speech recognition is not available. Please type your observation.");
    }
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = String(reader.result).split(",")[1];
      setImageB64(b64);
      doInterpret(text, b64);
    };
    reader.readAsDataURL(file);
  };

  const doInterpret = async (rawText, image) => {
    const t = (rawText || text || "").trim();
    if (!t && !image) return;
    setBusy(true);
    trackEvent(image ? "image_signal_submitted" : "vendor_signal_started");
    try {
      const res = await interpretSignal(t, image);
      if (res.ok && (res.signal || res.data)) {
        const s = res.signal || res.data;
        setDraft({ ...s, rawText: t });
        setEditText(t);
        setEditMode(false);
      } else {
        toast.error(res.error || "BazaarMind couldn't interpret that right now.");
      }
    } catch {
      toast.error("BazaarMind couldn't interpret that right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!draft) return;
    trackEvent("vendor_signal_confirmed");
    try {
      const isPrice = draft.reportedPrice != null;
      const res = await createSignal({
        marketId,
        vendorId: vendorLocation?.vendorId || participant?.id || undefined,
        dataSource,
        product: draft.product,
        signalType: draft.signalType || (isPrice ? "PRICE" : "SUPPLY"),
        availability: draft.availability,
        reportedPrice: draft.reportedPrice ?? null,
        priceUnit: draft.priceUnit ?? null,
        demandLevel: draft.demand && draft.demand !== "UNKNOWN" ? draft.demand : null,
        language: draft.language || "HINGLISH",
        rawText: draft.rawText || text,
        source: "VENDOR",
        confidence: draft.confidence || "MEDIUM",
        reasoning: draft.reasoning || "",
        vendorName: participant?.name ? `${participant.name}` : (vendorLocation?.vendorName || "Ramesh Sabzi Wala (demo stall)"),
        participantId: participant?.id,
      });

      if (res.published) {
        toast.success("धन्यवाद! आपका सिग्नल मार्केट पल्स में जुड़ गया है।");
      } else {
        toast.message("Signal received and held for review.");
      }
      setDraft(null);
      setText("");
      setImageB64(null);
      refreshPulse();
      loadSide();
    } catch {
      toast.error("Market data is temporarily unavailable.");
    }
  };

  return (
    <div>
      {/* Vendor Value Proposition Banner */}
      <div className="rounded-3xl bg-[#1E5631] text-[#FDFBF7] p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#F2C88C]">
            Vendor Market Intelligence
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold mt-1 text-[#FDFBF7] leading-snug">
            आप जो देखते हैं, BazaarMind को बताइए।<br />
            BazaarMind आपको पूरे बाजार की तस्वीर दिखाएगा।
          </h2>
          <p className="text-xs text-[#E9E4D6] mt-2 italic">
            "Tell BazaarMind what you see. BazaarMind shows you what the market is seeing."
          </p>
        </div>
      </div>

      {/* Location / Market context */}
      <div className="mt-4 mb-4">
        <VendorLocationCard
          marketId={marketId}
          dataSource={dataSource}
          participant={participant}
          onLocationChange={setVendorLocation}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* Main Voice & Signal Composer */}
        <div className="bg-white border border-[#E5DEC9] rounded-3xl p-5 md:p-6 shadow-sm flex flex-col justify-between" data-testid="vendor-signal-form">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBDE]">
              <div>
                <h3 className="font-display text-lg font-bold text-[#1E2022]">बाजार की स्थिति बताइए / Share Signal</h3>
                <p className="text-xs text-[#5C6360]">बोलकर या लिखकर बताएं — किसी फॉर्म की जरूरत नहीं</p>
              </div>

              {/* Mode Switcher */}
              <div className="flex bg-[#F7F4EE] p-1 rounded-xl border border-[#E5DEC9]">
                <button
                  type="button"
                  onClick={() => setMode("voice")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    mode === "voice" ? "bg-white text-[#1E5631] shadow-2xs" : "text-[#5C6360]"
                  }`}
                >
                  <Mic className="h-3.5 w-3.5" /> बोलिए
                </button>
                <button
                  type="button"
                  onClick={() => setMode("text")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    mode === "text" ? "bg-white text-[#1E5631] shadow-2xs" : "text-[#5C6360]"
                  }`}
                >
                  <Type className="h-3.5 w-3.5" /> लिखिए
                </button>
                <button
                  type="button"
                  onClick={() => setMode("photo")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    mode === "photo" ? "bg-white text-[#1E5631] shadow-2xs" : "text-[#5C6360]"
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" /> फोटो
                </button>
              </div>
            </div>

            {/* Voice Experience */}
            {mode === "voice" && (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={startVoice}
                  disabled={busy || transcribing}
                  data-testid="vendor-mic-button"
                  className={`relative h-28 w-28 rounded-full flex flex-col items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
                    recording
                      ? "bg-red-500 animate-pulse ring-8 ring-red-200"
                      : "bg-[#1E5631] hover:bg-[#194727] ring-8 ring-[#1E5631]/15"
                  }`}
                >
                  <Mic className="h-10 w-10 mb-1" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {recording ? "सुन रहा हूँ" : "बोलिए / Speak"}
                  </span>
                </button>

                <p className="font-hindi text-base font-semibold text-[#1E2022] mt-5">
                  {recording
                    ? "सुन रहा हूँ… अपनी भाषा में बोलिए"
                    : transcribing
                    ? "Gemini समझ रहा है…"
                    : "बटन दबाकर बोलिए (हिंदी, हिंग्लिश या इंग्लिश)"}
                </p>
                <p className="text-xs text-[#5C6360] mt-1 max-w-sm">
                  जैसे: "आज टमाटर थोड़ा कम आया है और रेट 70 रुपये है।"
                </p>
              </div>
            )}

            {/* Photo Experience */}
            {mode === "photo" && (
              <div className="py-4">
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" data-testid="vendor-photo-input" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-[#E5DEC9] bg-[#F7F4EE] px-4 py-8 text-center hover:border-[#1E5631]/40 transition-colors"
                >
                  <Camera className="h-8 w-8 mx-auto text-[#1E5631]" />
                  <div className="text-sm font-semibold text-[#1E2022] mt-2">
                    {imageB64 ? "Photo selected · tap to retake" : "दुकान / क्रेट की फोटो लें (Photo of stall/crate)"}
                  </div>
                  <div className="text-xs text-[#8A8A82] mt-1">
                    Gemini interprets visible produce and fullness directly.
                  </div>
                </button>

                <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-[11px] text-[#8A8A82]">Demo Crate Signals:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = "आज टमाटर की क्रेट लगभग खाली है, सिर्फ 20% बचा है।";
                      setText(sample);
                      doInterpret(sample, null);
                    }}
                    className="text-[11px] font-medium text-[#1E5631] bg-white border border-[#E5DEC9] px-2.5 py-1 rounded-full hover:bg-[#EAF4ED] transition-colors"
                  >
                    🍅 Tomato Crate (Low Stock)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = "आलू की भरपूर बोरियां आई हैं, पूरा स्टॉक भरा है।";
                      setText(sample);
                      doInterpret(sample, null);
                    }}
                    className="text-[11px] font-medium text-[#1E5631] bg-white border border-[#E5DEC9] px-2.5 py-1 rounded-full hover:bg-[#EAF4ED] transition-colors"
                  >
                    🥔 Potato Sack (Full Stock)
                  </button>
                </div>
              </div>
            )}

            {/* Text / Transcript Input */}
            <div className="mt-2">
              <label className="text-xs font-semibold text-[#5C6360] block mb-1.5">
                {mode === "voice" ? "आपका कहा हुआ (Your Words):" : "यहाँ लिखिए (Type here):"}
              </label>
              <textarea
                data-testid="vendor-text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                placeholder="उदा. आज टमाटर थोड़ा कम आया है और रेट 70 रुपये है…"
                className="w-full rounded-xl border border-[#E5DEC9] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#1E5631] focus:ring-2 focus:ring-[#1E5631]/15 resize-none"
              />
            </div>

            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => { setText(ex); doInterpret(ex, null); }}
                  className="text-[11px] rounded-full border border-[#E5DEC9] bg-[#FDFBF7] px-2.5 py-1 text-[#5C6360] hover:bg-[#F7F4EE] hover:text-[#1E2022] transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-4 pt-3 border-t border-[#F0EBDE] flex items-center justify-between">
            {busy ? (
              <ListeningLoader label="Gemini interpret kar raha hai…" />
            ) : (
              <span className="text-[11px] text-[#8A8A82]">
                Gemini translates natural words into structured intelligence.
              </span>
            )}

            <button
              type="button"
              onClick={() => doInterpret(text, imageB64)}
              disabled={busy || (!text.trim() && !imageB64)}
              data-testid="vendor-send-signal-button"
              className="inline-flex items-center gap-2 rounded-full bg-[#1E5631] text-[#FDFBF7] px-6 py-2.5 text-sm font-semibold hover:bg-[#194727] disabled:opacity-40 transition-colors shadow-sm shrink-0"
            >
              <Send className="h-4 w-4" /> समझें / Interpret
            </button>
          </div>
        </div>

        {/* Right Column: Today's Shopper Demand in this Market */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#1E5631] text-[#FDFBF7] rounded-3xl p-5 shadow-sm" data-testid="vendor-demand-panel">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#F2C88C]">
              <TrendingUp className="h-4 w-4" /> खरीदारों की मांग / Today's Demand
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {(demand?.products || []).slice(0, 5).map((d) => (
                <div key={d.product} className="flex items-center justify-between py-1 border-b border-white/10 last:border-0">
                  <span className="text-sm font-semibold">{d.product}</span>
                  <span className="text-xs text-[#FDFBF7]/85 font-mono">{d.level}</span>
                </div>
              ))}
              {!demand?.products?.length && (
                <div className="text-xs text-[#FDFBF7]/80 py-2">
                  Not enough shopper demand signals recorded yet today.
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-white/20 text-xs text-[#FDFBF7]/90 leading-snug">
              BazaarMind aggregates neighborhood shopper lists so you know what produce is in demand before it sells out.
            </div>
          </div>

          {/* Recent Signals Contributed */}
          <div className="bg-white border border-[#E5DEC9] rounded-3xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-[#5C6360]">
              <Store className="h-4 w-4 text-[#1E5631]" /> Your recent observations
            </div>
            <div className="mt-2 flex flex-col divide-y divide-[#F0EBDE]">
              {recent.length ? (
                recent.map((s) => (
                  <div key={s.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#1E2022]">{s.product}</div>
                      <div className="text-[11px] text-[#8A8A82] truncate">{s.rawText}</div>
                    </div>
                    {s.reportedPrice ? (
                      <span className="text-xs font-bold font-mono text-[#1E5631]">₹{s.reportedPrice}</span>
                    ) : (
                      <Chip tone="neutral">{s.availability || "OK"}</Chip>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#8A8A82] py-3 text-center">No observations submitted yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Localized Natural Confirmation Dialog */}
      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="bg-[#FDFBF7] max-w-md rounded-3xl border-2 border-[#1E5631]/30 p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E5631]">
              <Sparkles className="h-4 w-4" /> BazaarMind Interpreter
            </div>
            <DialogTitle className="font-display text-xl font-bold text-[#1E2022] mt-1">
              पुष्टि करें / Confirm Observation
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5C6360]">
              Review what Gemini extracted from your natural observation.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="my-4">
              {!editMode ? (
                /* Natural Confirmation Display (No complex technical schemas) */
                <div className="rounded-2xl bg-white border border-[#E5DEC9] p-4 shadow-sm space-y-3">
                  <div className="text-xs text-[#8A8A82] uppercase tracking-wide">Understood Observation:</div>

                  <div className="font-display text-lg font-bold text-[#1E2022] whitespace-pre-line bg-[#F7F4EE] p-3.5 rounded-xl border border-[#E5DEC9]">
                    {draft.confirmationText || `मैंने समझा:\n${draft.product} — ${draft.availability || "सामान्य उपलब्धता"}${draft.reportedPrice ? `\n₹${draft.reportedPrice}/${draft.priceUnit || "kg"}` : ""}`}
                  </div>

                  <div className="text-xs text-[#5C6360] flex items-center justify-between pt-1">
                    <span>भाषा: {draft.language || "HINGLISH"}</span>
                    <span className="font-mono text-[11px] text-[#1E5631]">Signal: {draft.signalType || "PRICE"}</span>
                  </div>
                </div>
              ) : (
                /* Natural text editing instead of complex enums */
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#5C6360]">
                    Modify your observation in natural words:
                  </label>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-[#E5DEC9] bg-white p-3 text-sm outline-none focus:border-[#1E5631]"
                  />
                  <button
                    type="button"
                    onClick={() => doInterpret(editText, null)}
                    className="px-4 py-2 rounded-xl bg-[#1E5631] text-white text-xs font-semibold hover:bg-[#194727]"
                  >
                    Re-interpret with Gemini
                  </button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            {!editMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  data-testid="draft-edit-button"
                  className="flex-1 py-2.5 px-4 rounded-full border border-[#E5DEC9] bg-white text-xs font-semibold text-[#1E2022] hover:bg-[#F7F4EE] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" /> ✎ बदलें / Edit
                </button>
                <button
                  type="button"
                  onClick={publish}
                  data-testid="vendor-confirm-publish-button"
                  className="flex-1 py-2.5 px-4 rounded-full bg-[#1E5631] text-xs font-semibold text-white hover:bg-[#194727] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="h-4 w-4" /> ✓ सही है / Confirm
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="w-full py-2 rounded-full border border-[#E5DEC9] text-xs text-[#5C6360]"
              >
                Back to confirmation
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
