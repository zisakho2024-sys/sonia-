import type { RouteStop } from "./busRoutes";
import {
  extractRouteFromImageFn,
  extractRouteFromTextFn,
  isGeminiConfiguredFn,
} from "@/server/extractRoute";

export type ExtractedRoute = {
  bus_name: string;
  reg_number: string;
  source: string;
  destination: string;
  bus_type: string;
  route_data: RouteStop[];
  bus_name_bn: string;
  source_bn: string;
  destination_bn: string;
  bus_type_bn: string;
  route_data_bn: RouteStop[];
};

/**
 * Probes the server to see if GEMINI_API_KEY is configured.
 * Safe-mode: any failure (network, missing function, etc.) is treated as
 * "not configured" so the admin UI falls back to manual entry instead of crashing.
 */
export async function checkGeminiConfigured(): Promise<boolean> {
  try {
    const res = await isGeminiConfiguredFn();
    return Boolean(res?.configured);
  } catch {
    return false;
  }
}

function fileToBase64(file: File): Promise<{ data: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [, b64] = result.split(",");
      resolve({ data: b64, mime: file.type || "image/jpeg" });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function extractFromImage(file: File): Promise<ExtractedRoute> {
  const { data, mime } = await fileToBase64(file);
  return extractRouteFromImageFn({ data: { base64: data, mime } });
}

export async function extractFromText(text: string): Promise<ExtractedRoute> {
  return extractRouteFromTextFn({ data: { text } });
}
