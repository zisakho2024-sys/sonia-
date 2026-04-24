import { supabase } from "./supabase";

/**
 * Simple key/value settings store backed by the `app_settings` table.
 * Falls back to bundled defaults when the table doesn't exist yet.
 *
 * Schema (run once in Supabase SQL Editor):
 *   create table if not exists public.app_settings (
 *     key text primary key,
 *     value text not null default '',
 *     updated_at timestamptz not null default now()
 *   );
 *   alter table public.app_settings enable row level security;
 *   create policy "public read settings" on public.app_settings
 *     for select to anon, authenticated using (true);
 *   create policy "admins write settings" on public.app_settings
 *     for all to authenticated
 *     using (public.has_role(auth.uid(), 'admin'))
 *     with check (public.has_role(auth.uid(), 'admin'));
 */

const TABLE = "app_settings";

export const SETTING_KEYS = {
  disclaimerTitleEn: "disclaimer_title_en",
  disclaimerTitleBn: "disclaimer_title_bn",
  disclaimerBodyEn: "disclaimer_body_en",
  disclaimerBodyBn: "disclaimer_body_bn",
} as const;

export const DEFAULT_DISCLAIMER = {
  titleEn: "Disclaimer",
  titleBn: "ডিসক্লেইমার",
  bodyEn: [
    "Bus route, timing, stops, and fare details are collected through ground survey and digital sources. Information may not always be 100% accurate.",
    "We recommend confirming details with the bus driver, conductor, or bus operator before travel.",
    "SoniaBuddy is an informational platform only and does not support ticket booking. We are not responsible for any delays, losses, or incidents.",
  ].join("\n\n"),
  bodyBn: [
    "বাসের রুট, সময়, স্টপ এবং ভাড়ার তথ্য গ্রাউন্ড সার্ভে ও অনলাইন উৎস থেকে সংগ্রহ করা হয়। সব তথ্য সবসময় ১০০% সঠিক নাও হতে পারে।",
    "যাত্রার আগে বাসের চালক, কন্ডাক্টর বা বাস অপারেটরের কাছ থেকে তথ্য মিলিয়ে নেওয়ার অনুরোধ করা হলো।",
    "SoniaBuddy শুধুমাত্র একটি ইনফরমেশন প্ল্যাটফর্ম — এখানে টিকিট বুকিং হয় না। কোনো দেরি, ক্ষতি বা দুর্ঘটনার জন্য আমরা দায়ী নই।",
  ].join("\n\n"),
};

export type AppSetting = { key: string; value: string };

function isMissingTable(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return /relation .* does not exist|schema cache|404|app_settings/i.test(msg);
}

/** Fetch all settings. Returns empty map on missing table (silent). */
export async function getAllSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from(TABLE).select("key,value");
  if (error) {
    if (isMissingTable(error)) return {};
    throw error;
  }
  const map: Record<string, string> = {};
  for (const row of (data ?? []) as AppSetting[]) {
    map[row.key] = row.value ?? "";
  }
  return map;
}

/** Upsert one setting (admin-only via RLS). */
export async function upsertSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}

export type DisclaimerContent = {
  titleEn: string;
  titleBn: string;
  bodyEn: string;
  bodyBn: string;
};

export function buildDisclaimer(map: Record<string, string>): DisclaimerContent {
  return {
    titleEn: map[SETTING_KEYS.disclaimerTitleEn]?.trim() || DEFAULT_DISCLAIMER.titleEn,
    titleBn: map[SETTING_KEYS.disclaimerTitleBn]?.trim() || DEFAULT_DISCLAIMER.titleBn,
    bodyEn: map[SETTING_KEYS.disclaimerBodyEn]?.trim() || DEFAULT_DISCLAIMER.bodyEn,
    bodyBn: map[SETTING_KEYS.disclaimerBodyBn]?.trim() || DEFAULT_DISCLAIMER.bodyBn,
  };
}

export const SETTINGS_SQL = `-- Run once in Supabase SQL Editor:
create table if not exists public.app_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
create policy "public read settings" on public.app_settings
  for select to anon, authenticated using (true);
create policy "admins write settings" on public.app_settings
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));`;
