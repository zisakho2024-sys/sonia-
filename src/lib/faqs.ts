import { supabase } from "./supabase";

export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  // Optional Bengali (বাংলা) localized fields. Null/empty when not yet translated.
  question_bn?: string | null;
  answer_bn?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type FaqInput = {
  question: string;
  answer: string;
  category: string | null;
  question_bn?: string | null;
  answer_bn?: string | null;
};

/** Public read — used by /faq page and Footer FAQ teaser. */
export async function listFaqs(): Promise<Faq[]> {
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Faq[];
}

/** Admin: list (same query but reused for clarity / future admin-only filters). */
export async function listAllFaqs(): Promise<Faq[]> {
  return listFaqs();
}

function buildPayload(input: FaqInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    question: input.question.trim(),
    answer: input.answer.trim(),
    category: input.category?.trim() || null,
  };
  if (input.question_bn?.trim()) payload.question_bn = input.question_bn.trim();
  if (input.answer_bn?.trim()) payload.answer_bn = input.answer_bn.trim();
  return payload;
}

type PgError = { message?: string } | null;

function isMissingBnCol(err: PgError): boolean {
  return !!err && /column .*_bn.* does not exist/i.test(err.message ?? "");
}

function stripBn(payload: Record<string, unknown>): Record<string, unknown> {
  const safe = { ...payload };
  for (const k of Object.keys(safe)) if (k.endsWith("_bn")) delete safe[k];
  return safe;
}

export async function createFaq(input: FaqInput): Promise<Faq> {
  const payload = buildPayload(input);
  const first = await supabase.from("faqs").insert(payload).select("*").single();
  if (isMissingBnCol(first.error)) {
    const retry = await supabase.from("faqs").insert(stripBn(payload)).select("*").single();
    if (retry.error) throw retry.error;
    return retry.data as Faq;
  }
  if (first.error) throw first.error;
  return first.data as Faq;
}

export async function updateFaq(id: string, input: FaqInput): Promise<Faq> {
  const payload = buildPayload(input);
  const first = await supabase.from("faqs").update(payload).eq("id", id).select("*").single();
  if (isMissingBnCol(first.error)) {
    const retry = await supabase
      .from("faqs")
      .update(stripBn(payload))
      .eq("id", id)
      .select("*")
      .single();
    if (retry.error) throw retry.error;
    return retry.data as Faq;
  }
  if (first.error) throw first.error;
  return first.data as Faq;
}

export async function deleteFaq(id: string): Promise<void> {
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) throw error;
}
