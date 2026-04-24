import { createServerFn } from "@tanstack/react-start";
import type { RouteStop } from "@/lib/busRoutes";

const MODEL = "gemini-2.0-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type ExtractedRoute = {
  bus_name: string;
  reg_number: string;
  source: string;
  destination: string;
  bus_type: string;
  route_data: RouteStop[];
  // Bengali equivalents (auto-translated/transliterated by the model).
  bus_name_bn: string;
  source_bn: string;
  destination_bn: string;
  bus_type_bn: string;
  route_data_bn: RouteStop[];
};

const SYSTEM_PROMPT = `You are a strict bilingual (English + Bengali) structured-data extractor for West Bengal bus route schedules.

Given a photograph of a printed timetable OR raw pasted text, return STRICT JSON
matching EXACTLY this TypeScript shape — and NOTHING else (no markdown fences, no prose, no comments):

{
  "bus_name": string,           // English (Latin script)
  "reg_number": string,         // e.g. "WB-23-1234"
  "source": string,             // English place name
  "destination": string,        // English place name
  "bus_type": string,           // English short label
  "route_data": Array<{ "stoppage_name": string, "up_time": string, "down_time": string }>,

  "bus_name_bn": string,        // Bengali (বাংলা) version of bus_name
  "source_bn": string,          // Bengali version of source
  "destination_bn": string,     // Bengali version of destination
  "bus_type_bn": string,        // Bengali version of bus_type
  "route_data_bn": Array<{ "stoppage_name": string, "up_time": string, "down_time": string }>
}

EXTRACTION RULES:
1. Extract ONLY these fields. Ignore phone numbers, addresses, ads, prices.
2. CLEAN every string: remove emojis, decorative symbols (★ ✦ ➤ ❖ • etc.), arrows, asterisks; collapse spaces; trim.
3. Use proper Title Case in English ("Kolkata", not "KOLKATA").
4. reg_number: uppercase hyphenated like "WB-23-1234". If absent, "".
5. bus_type: short label only ("AC Sleeper", "Non-AC", "Volvo", "Express"). If unknown, "".
6. route_data is the ENGLISH version, ordered top-to-bottom; times in 12-hour zero-padded "HH:MM AM/PM"; if a direction is missing, copy the same time to the other field.
7. route_data_bn MUST mirror route_data: same length, same order, same up_time/down_time values.
   Only the stoppage_name field changes — translate/transliterate each stop name into Bengali script.

BILINGUAL RULES (CRITICAL — West Bengal conversational Bengali / Chalti Bhasha):
- Write all Bengali in **simple everyday spoken Bengali (Chalti Bhasha)** — the
  language a common commuter in West Bengal actually uses on the street. DO NOT
  use heavy Sanskrit-derived (Sadhu Bhasha) or formal/literary words.
  Everyday word examples:
    • "খুঁজুন" — NOT "অনুসন্ধান করুন"
    • "থেকে" for source — NOT "প্রস্থান"
    • "পর্যন্ত" / "দিকে" for destination — NOT "গন্তব্য"
    • "সময়" for schedule — NOT "সময়সূচি" / "সময়সূচী"
    • "ছাড়ার সময়" — NOT "প্রস্থানের সময়"
    • "পৌঁছানোর সময়" — NOT "আগমনের সময়"
    • "স্টপ" — NOT "স্টপেজ" / "বিরতিস্থল"
- Proper-noun transliterations MUST match how locals say them:
    "Howrah" → "হাওড়া", "Kolkata" → "কলকাতা", "Sealdah" → "শিয়ালদহ",
    "Digha" → "দিঘা", "Tarkeshwar" → "তারকেশ্বর", "Arambagh" → "আরামবাগ",
    "Barasat" → "বারাসাত", "Esplanade" → "এসপ্ল্যানেড",
    "Durgapur" → "দুর্গাপুর", "Asansol" → "আসানসোল", "Siliguri" → "শিলিগুড়ি".
- If the input is already in Bengali, transliterate to English Latin script for the English fields.
- bus_type translations as a local commuter would recognise them (keep short & spoken):
    "AC" → "এসি", "Non-AC" → "নন-এসি", "AC Sleeper" → "এসি স্লিপার",
    "Volvo" → "ভলভো", "Express" → "এক্সপ্রেস", "Local" → "লোকাল",
    "Super" → "সুপার", "Deluxe" → "ডিলাক্স".
- Every English field MUST have a non-empty Bengali counterpart (and vice versa). Never leave a Bengali field blank if the English one has a value.
- Times (up_time/down_time) are NEVER translated — keep digits + AM/PM.

8. If a field is genuinely missing, use empty string "" — NEVER null, NEVER "N/A", NEVER "-".
9. If the input does NOT contain a bus timetable, return: {"error": "No bus timetable detected in the input."}

OUTPUT ONLY the JSON object. No markdown. No prose.`;

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function extractJsonObject(raw: string): string {
  const cleaned = stripFences(raw);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("AI response did not contain a JSON object.");
  }
  return cleaned
    .slice(start, end + 1)
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

function cleanString(v: unknown): string {
  if (typeof v !== "string") return "";
  return v
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]/gu, "")
    .replace(/[★✦➤❖•◆◇■□▪▫※]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStops(raw: unknown): RouteStop[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((s: unknown) => {
      const obj = (s ?? {}) as Record<string, unknown>;
      return {
        stoppage_name: cleanString(obj.stoppage_name),
        up_time: cleanString(obj.up_time),
        down_time: cleanString(obj.down_time),
      };
    })
    .filter((s) => s.stoppage_name.length > 0);
}

const BUSY_MESSAGE = "AI is busy, please fill manually.";

async function callGemini(parts: unknown[]): Promise<ExtractedRoute> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    // Don't crash — surface a friendly message the admin UI can show.
    throw new Error(
      "AI is not configured on the server (missing GEMINI_API_KEY). Please fill the form manually.",
    );
  }

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      }),
    });
  } catch {
    throw new Error(BUSY_MESSAGE);
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    // Auth / key problems — tell the admin clearly but don't crash.
    if (res.status === 400 && /API key/i.test(errBody)) {
      throw new Error("Invalid Gemini API key. Please fill the form manually.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("AI access denied (check GEMINI_API_KEY). Please fill manually.");
    }
    // Rate-limit / quota / server errors → friendly "busy" message so the
    // admin knows to fill the form manually.
    if (res.status === 429 || res.status >= 500) {
      throw new Error(BUSY_MESSAGE);
    }
    throw new Error(`AI error ${res.status}. Please fill manually.`);
  }

  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const blockReason = json?.promptFeedback?.blockReason;
    if (blockReason) throw new Error(`Gemini blocked the request: ${blockReason}`);
    throw new Error("Gemini returned an empty response. Try a clearer photo or pasted text.");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(extractJsonObject(text));
  } catch (e) {
    throw new Error(
      `Could not parse AI response as JSON: ${e instanceof Error ? e.message : "unknown"}`,
    );
  }

  if (typeof parsed.error === "string" && parsed.error.trim()) {
    throw new Error(parsed.error);
  }

  const route_data = normalizeStops(parsed.route_data);
  const route_data_bn = normalizeStops(parsed.route_data_bn);

  const result: ExtractedRoute = {
    bus_name: cleanString(parsed.bus_name),
    reg_number: cleanString(parsed.reg_number).toUpperCase(),
    source: cleanString(parsed.source),
    destination: cleanString(parsed.destination),
    bus_type: cleanString(parsed.bus_type),
    route_data,
    bus_name_bn: cleanString(parsed.bus_name_bn),
    source_bn: cleanString(parsed.source_bn),
    destination_bn: cleanString(parsed.destination_bn),
    bus_type_bn: cleanString(parsed.bus_type_bn),
    route_data_bn,
  };

  if (!result.bus_name && !result.source && !result.destination && route_data.length === 0) {
    throw new Error("No bus timetable details could be extracted. Try a clearer photo.");
  }

  return result;
}

export const isGeminiConfiguredFn = createServerFn({ method: "GET" }).handler(
  async () => ({ configured: Boolean(process.env.GEMINI_API_KEY) }),
);

export const extractRouteFromImageFn = createServerFn({ method: "POST" })
  .inputValidator((input: { base64: string; mime: string }) => {
    if (!input || typeof input.base64 !== "string" || typeof input.mime !== "string") {
      throw new Error("Invalid input: expected { base64, mime }.");
    }
    if (input.base64.length === 0) throw new Error("Empty image data.");
    if (input.base64.length > 8_000_000) throw new Error("Image too large (max ~6MB).");
    return input;
  })
  .handler(async ({ data }) => {
    return callGemini([
      { text: "Extract the bus route schedule from this image. Return BOTH English and Bengali (বাংলা) versions for every text field." },
      { inlineData: { mimeType: data.mime, data: data.base64 } },
    ]);
  });

export const extractRouteFromTextFn = createServerFn({ method: "POST" })
  .inputValidator((input: { text: string }) => {
    if (!input || typeof input.text !== "string") throw new Error("Invalid input: expected { text }.");
    const trimmed = input.text.trim();
    if (!trimmed) throw new Error("Empty text.");
    if (trimmed.length > 50_000) throw new Error("Text too long (max 50k chars).");
    return { text: trimmed };
  })
  .handler(async ({ data }) => {
    return callGemini([
      { text: `Extract the bus route schedule from this text. Return BOTH English and Bengali (বাংলা) versions for every text field.\n\n${data.text}` },
    ]);
  });
