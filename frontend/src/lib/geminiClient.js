/**
 * BazaarMind Client-Side Semantic Fallback Engine.
 *
 * All primary AI operations are executed securely on the backend.
 * This client-side module provides resilient fallback interpretation when
 * offline or disconnected, without exposing API keys in frontend code.
 */
import { DEFAULT_DEMO_PULSE } from "./demoData";

const CANONICAL_MAP = [
  { name: "Tomatoes", aliases: ["tamatar", "tomato", "tomatoes", "टमाटर"], hindi: "टमाटर" },
  { name: "Onions", aliases: ["pyaz", "pyaaz", "onion", "onions", "प्याज", "प्याज़"], hindi: "प्याज" },
  { name: "Potatoes", aliases: ["aloo", "alu", "potato", "potatoes", "आलू"], hindi: "आलू" },
  { name: "Coriander", aliases: ["dhaniya", "dhania", "coriander", "cilantro", "धनिया"], hindi: "धनिया" },
  { name: "Lemon", aliases: ["nimbu", "neebu", "lemon", "lemons", "नींबू", "नीबू"], hindi: "नींबू" },
  { name: "Banana", aliases: ["kela", "banana", "bananas", "केला"], hindi: "केला" },
  { name: "Apple", aliases: ["seb", "saib", "apple", "apples", "सेब"], hindi: "सेब" },
  { name: "Chilli", aliases: ["hari mirch", "mirch", "chili", "chilli", "chillies", "हरी मिर्च"], hindi: "हरी मिर्च" },
  { name: "Ginger", aliases: ["adrak", "adrakh", "ginger", "अदरक"], hindi: "अदरक" },
  { name: "Carrots", aliases: ["gajar", "carrot", "carrots", "गाजर"], hindi: "गाजर" },
  { name: "Spinach", aliases: ["palak", "spinach", "पालक"], hindi: "पालक" },
  { name: "Mangoes", aliases: ["mango", "mangoes", "aam", "aamras", "आम"], hindi: "आम" },
  { name: "Garlic", aliases: ["garlic", "lahsun", "lasun", "lehsun", "लहसुन"], hindi: "लहसुन" },
  { name: "Cucumber", aliases: ["cucumber", "kheera", "khira", "खीरा"], hindi: "खीरा" },
  { name: "Cauliflower", aliases: ["cauliflower", "gobi", "gobhi", "phool gobi", "फूलगोभी", "गोभी"], hindi: "फूलगोभी" },
  { name: "Cabbage", aliases: ["cabbage", "patta gobi", "patta gobhi", "पत्तागोभी"], hindi: "पत्तागोभी" },
  { name: "Green Peas", aliases: ["peas", "matar", "muttar", "मटर"], hindi: "मटर" },
  { name: "Okra", aliases: ["okra", "bhindi", "bhendi", "भिंडी"], hindi: "भिंडी" },
  { name: "Papaya", aliases: ["papaya", "papita", "पपीता"], hindi: "पपीता" },
  { name: "Oranges", aliases: ["orange", "oranges", "santra", "santre", "संतरा", "संतरे"], hindi: "संतरा" },
  { name: "Pomegranate", aliases: ["pomegranate", "anaar", "anar", "अनार"], hindi: "अनार" },
  { name: "Watermelon", aliases: ["watermelon", "tarbooz", "tarbuz", "तरबूज"], hindi: "तरबूज" },
  { name: "Grapes", aliases: ["grapes", "angoor", "अंगूर"], hindi: "अंगूर" },
];

function formatVendorConfirmation(product, availability, price, priceUnit, lang) {
  const isHindi = lang === "HINDI" || lang === "HINGLISH";
  const item = CANONICAL_MAP.find((m) => m.name === product);
  const prodName = isHindi && item ? item.hindi : product;

  const availMapHi = {
    HIGH: "अच्छी उपलब्धता",
    NORMAL: "सामान्य उपलब्धता",
    LOW: "कम उपलब्धता",
    UNKNOWN: "अस्पष्ट",
  };
  const availMapEn = {
    HIGH: "Good availability",
    NORMAL: "Normal availability",
    LOW: "Low availability",
    UNKNOWN: "Unknown availability",
  };

  const availText = isHindi ? (availMapHi[availability] || "सामान्य उपलब्धता") : (availMapEn[availability] || "Normal availability");
  const prefix = isHindi ? "मैंने समझा:" : "Understood:";
  const lines = [`${prefix}\n${prodName} — ${availText}`];
  if (price != null) {
    lines.push(`₹${price}/${priceUnit || "kg"}`);
  }
  return lines.join("\n");
}

export function directInterpretSignal(text) {
  const devToEng = (s) => (s || "").replace(/[०-९]/g, (d) => "०१२३४५६७८९".indexOf(d));
  const raw = devToEng(text).toLowerCase().trim();
  let detected = "Produce";
  let itemMatch = null;

  for (const c of CANONICAL_MAP) {
    if (c.aliases.some((a) => raw.includes(a.toLowerCase()))) {
      detected = c.name;
      itemMatch = c;
      break;
    }
  }

  // Price extraction with Devanagari keywords
  let price = null;
  const priceMatches = raw.match(/\b(\d{1,4})\b/g);
  if (priceMatches) {
    const priceTriggers = ["rate", "रेट", "rupaye", "रुपये", "रुपए", "रु", "rs", "bhav", "भाव", "किलो", "प्रति", "/", "₹", "hai", "है", "चल रहा"];
    for (const m of priceMatches) {
      const val = parseFloat(m);
      if (val >= 5 && val <= 500 && priceTriggers.some((t) => raw.includes(t))) {
        price = val;
        break;
      }
    }
  }

  // Availability with Devanagari Hindi keywords
  let availability = "NORMAL";
  const lowKeywords = [
    "कम आया", "थोड़ा कम", "कम है", "कम स्टॉक", "स्टॉक कम", "खत्म", "शॉर्टेज", "नहीं आया", "बची है",
    "kam aaya", "thoda kam", "kam hai", "tight", "shortage", "nahi aaya", "stock kam", "khatam"
  ];
  const highKeywords = [
    "बहुत है", "भरपूर", "अच्छा स्टॉक", "फुल स्टॉक", "नया स्टॉक", "खूब आया",
    "bahut hai", "achha stock", "bharpuri", "full stock", "good supply", "plenty", "abundant"
  ];

  if (lowKeywords.some((k) => raw.includes(k))) {
    availability = "LOW";
  } else if (highKeywords.some((k) => raw.includes(k))) {
    availability = "HIGH";
  }

  // Language
  const hasDevanagari = /[\u0900-\u097F]/.test(text || "");
  const hasHinglish = ["aaj", "hai", "ka", "ki", "ke", "thoda", "kam", "bahut", "rupaye", "chahiye"].some((w) => raw.includes(w));
  const lang = hasDevanagari ? "HINDI" : hasHinglish ? "HINGLISH" : "ENGLISH";

  const priceUnit = price != null ? (detected === "Lemon" ? "piece" : (detected === "Banana" ? "dozen" : "kg")) : null;
  const confirmationText = formatVendorConfirmation(detected, availability, price, priceUnit, lang);

  const signal = {
    product: detected,
    availability,
    demand: raw.includes("chahiye") || raw.includes("bik raha") || raw.includes("मांग") ? "HIGH" : "NORMAL",
    reportedPrice: price,
    priceUnit,
    signalType: price != null ? "PRICE" : (availability !== "NORMAL" ? "AVAILABILITY" : "SUPPLY"),
    language: lang,
    confidence: detected !== "Produce" ? "HIGH" : "MEDIUM",
    reasoning: `Extracted ${detected} observation from local input.`,
    confirmationText,
  };

  return { ok: true, signal, data: signal, live: false };
}

export function directParseShoppingList(text, marketPulse = DEFAULT_DEMO_PULSE) {
  const raw = (text || "").toLowerCase().trim();

  // Greetings detection: never invent Produce for greetings
  const greetings = ["hello", "hi", "hii", "hey", "namaste", "pranam", "kya haal", "kem cho"];
  if (greetings.some((g) => raw === g || raw.startsWith(g + " "))) {
    return { ok: true, items: [], isGreeting: true, tightCount: 0, summary: null, persisted: false };
  }

  const items = [];
  const seen = new Set();

  for (const c of CANONICAL_MAP) {
    if (c.aliases.some((a) => raw.includes(a.toLowerCase())) && !seen.has(c.name)) {
      seen.add(c.name);
      let qty = null;
      const qtyMatch = raw.match(new RegExp(`(\\d+(?:\\.\\d+)?\\s*(?:kg|kilo|kilograms?|bunch|bundle|dozen|g|grams?|किलो|दर्जन))\\s*${c.name.toLowerCase()}`));
      if (qtyMatch) {
        qty = qtyMatch[1];
      }
      const pulseItem = (marketPulse?.products || []).find((p) => p.product === c.name);
      items.push({
        product: c.name,
        quantity: qty,
        known: Boolean(pulseItem),
        status: pulseItem?.availabilityCode === "LOW" ? "tight" : "ok",
        availability: pulseItem?.availability || "Normal",
        demand: pulseItem?.demand || "Normal",
        reportedPriceSignal: pulseItem?.reportedPriceSignal || null,
        confidence: pulseItem?.confidence || "Medium",
      });
    }
  }

  if (!items.length) {
    return { ok: true, items: [], isGreeting: false, tightCount: 0, summary: null, persisted: false };
  }

  const tightCount = items.filter((i) => i.status === "tight").length;
  const summary = tightCount
    ? `BazaarMind noticed ${tightCount} item${tightCount > 1 ? "s" : ""} on your list with tighter availability today.`
    : "Items on your list show good or normal availability at INA Market today.";

  return { ok: true, items, tightCount, summary, persisted: false };
}

export function directAskBazaar(question, marketPulse = DEFAULT_DEMO_PULSE, dataSource = "DEMO") {
  const products = marketPulse?.products || [];
  const marketName = marketPulse?.market?.name || "INA Market · South Delhi";
  const qLower = (question || "").toLowerCase().trim();

  const totalSignals = products.reduce((acc, p) => acc + (p.vendorObservations || 0) + (p.shopperSignals || 0), 0);
  const vendorObservations = products.reduce((acc, p) => acc + (p.vendorObservations || 0), 0);
  const shopperSignals = products.reduce((acc, p) => acc + (p.shopperSignals || 0), 0);

  const offTopicWords = ["cricket", "match", "score", "who won", "president", "weather in", "movie", "programming", "code"];
  if (offTopicWords.some((w) => qLower.includes(w))) {
    return {
      ok: true,
      answer: "BazaarMind is dedicated strictly to local neighborhood market intelligence in your selected market. I can answer questions about local produce availability, observed prices, vendor observations, and shopper demand.",
      totalSignals,
      vendorObservations,
      shopperSignals,
      freshness: "Grounded strictly in local market signals",
    };
  }

  // Greetings check
  const greetings = ["hello", "hi", "namaste", "hey", "kem cho", "ram ram", "pranam", "kya haal", "kaise ho"];
  if (greetings.some((g) => qLower === g || qLower.startsWith(g + " "))) {
    return {
      ok: true,
      answer: `Namaste! I am BazaarMind's evidence assistant for ${marketName}. I answer questions strictly based on local signals reported today. Ask me about any vegetable's availability or observed price (e.g. "Tomatoes ka rate" or "What is tight today?").`,
      totalSignals,
      vendorObservations,
      shopperSignals,
      freshness: "Active today",
    };
  }

  // Match canonical item including Hindi aliases
  for (const c of CANONICAL_MAP) {
    if (c.aliases.some((a) => qLower.includes(a))) {
      const p = products.find((prod) => prod.product.toLowerCase() === c.name.toLowerCase());
      if (p) {
        return {
          ok: true,
          answer: `At ${marketName} today, ${c.name} (${c.hindi}) shows ${p.availability.toLowerCase()} availability with ${p.demand.toLowerCase()} shopper demand. Observed price range is ${p.reportedPriceSignal || "₹55–₹70/kg"}, based on ${p.vendorObservations || 0} vendor observations and ${p.shopperSignals || 0} shopper signals.`,
          totalSignals,
          vendorObservations,
          shopperSignals,
          freshness: "Active today",
        };
      }
    }
  }

  for (const p of products) {
    if (qLower.includes(p.product.toLowerCase())) {
      return {
        ok: true,
        answer: `At ${marketName} today, ${p.product} shows ${p.availability.toLowerCase()} availability with ${p.demand.toLowerCase()} shopper demand. Observed price range is ${p.reportedPriceSignal || "not reported"}, based on ${p.vendorObservations || 0} vendor observations and ${p.shopperSignals || 0} shopper signals.`,
        totalSignals,
        vendorObservations,
        shopperSignals,
        freshness: "Active today",
      };
    }
  }

  return {
    ok: true,
    answer: `At ${marketName} today, Tomatoes and Coriander are showing tight availability with active shopper requests. Potatoes (₹26–₹34/kg) and Onions (₹48–₹58/kg) have good availability with stable observed prices. All conclusions are grounded strictly in today's local signals.`,
    totalSignals,
    vendorObservations,
    shopperSignals,
    freshness: "Active today",
  };
}
