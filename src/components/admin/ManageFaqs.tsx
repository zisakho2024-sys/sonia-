import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Loader2, Plus, MessageCircleQuestion, ArrowDownUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listAllFaqs, createFaq, updateFaq, deleteFaq, type Faq, type FaqInput } from "@/lib/faqs";

type FormState = FaqInput & { id?: string };

const empty: FormState = {
  question: "",
  answer: "",
  category: "",
  question_bn: "",
  answer_bn: "",
};

type SortKey = "newest" | "oldest" | "category";

export function ManageFaqs() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "faqs"], queryFn: listAllFaqs });
  const [form, setForm] = useState<FormState | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");

  const sorted = useMemo(() => {
    const arr = [...(data ?? [])];
    if (sort === "newest") {
      arr.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    } else if (sort === "oldest") {
      arr.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
    } else if (sort === "category") {
      arr.sort((a, b) => (a.category ?? "zzz").localeCompare(b.category ?? "zzz"));
    }
    return arr;
  }, [data, sort]);

  const createMut = useMutation({
    mutationFn: (input: FaqInput) => createFaq(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      qc.invalidateQueries({ queryKey: ["faqs"] });
      toast.success("FAQ added");
      setForm(null);
    },
    onError: (err: Error) =>
      toast.error("Add failed", { description: friendlyError(err.message) }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FaqInput }) => updateFaq(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      qc.invalidateQueries({ queryKey: ["faqs"] });
      toast.success("FAQ updated");
      setForm(null);
    },
    onError: (err: Error) =>
      toast.error("Update failed", { description: friendlyError(err.message) }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFaq(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      qc.invalidateQueries({ queryKey: ["faqs"] });
      toast.success("FAQ deleted");
      setDeleteId(null);
    },
    onError: (err: Error) =>
      toast.error("Delete failed", { description: friendlyError(err.message) }),
  });

  const submitting = createMut.isPending || updateMut.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("English question and answer are required");
      return;
    }
    const input: FaqInput = {
      question: form.question,
      answer: form.answer,
      category: form.category?.trim() || null,
      question_bn: form.question_bn?.trim() || null,
      answer_bn: form.answer_bn?.trim() || null,
    };
    if (form.id) updateMut.mutate({ id: form.id, data: input });
    else createMut.mutate(input);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Manage FAQs</h2>
          <p className="text-xs text-muted-foreground">
            Questions shown on the public /faq page and footer. Bengali fields are optional but recommended.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowDownUp className="w-3.5 h-3.5" /> Sort
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-[140px] rounded-xl text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setForm({ ...empty })} className="rounded-xl bg-orange-gradient text-primary-foreground font-semibold">
            <Plus className="w-4 h-4" /> Add FAQ
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          Failed to load: {friendlyError((error as Error).message)}
        </div>
      )}

      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <div className="rounded-3xl border border-border bg-card-gradient p-12 text-center">
          <MessageCircleQuestion className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">No FAQs yet</p>
          <p className="text-sm text-muted-foreground">
            Click &ldquo;Add FAQ&rdquo; to publish your first question.
          </p>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="grid gap-3">
          {sorted.map((faq: Faq) => (
            <div
              key={faq.id}
              className="rounded-2xl border border-border bg-card-gradient px-4 py-3 hover:border-primary/40 transition-smooth"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{faq.question}</div>
                  {faq.question_bn && (
                    <div className="font-semibold text-sm text-muted-foreground/90 mt-0.5" lang="bn">
                      {faq.question_bn}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">{faq.answer}</div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {faq.category && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {faq.category}
                      </span>
                    )}
                    {faq.question_bn ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        EN + BN
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        EN only
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setForm({
                        id: faq.id,
                        question: faq.question,
                        answer: faq.answer,
                        category: faq.category ?? "",
                        question_bn: faq.question_bn ?? "",
                        answer_bn: faq.answer_bn ?? "",
                      })
                    }
                    className="rounded-xl"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteId(faq.id)}
                    className="rounded-xl text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={Boolean(form)} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          {form && (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="faq-q">Question (English)</Label>
                  <Input
                    id="faq-q"
                    value={form.question}
                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                    placeholder="e.g. How accurate are the schedules?"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="faq-q-bn">প্রশ্ন (বাংলা)</Label>
                  <Input
                    id="faq-q-bn"
                    lang="bn"
                    value={form.question_bn ?? ""}
                    onChange={(e) => setForm({ ...form, question_bn: e.target.value })}
                    placeholder="যেমন: সময়সূচী কতটা সঠিক?"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="faq-a">Answer (English)</Label>
                  <Textarea
                    id="faq-a"
                    rows={6}
                    value={form.answer}
                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                    placeholder="Plain text answer. Line breaks are preserved."
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="faq-a-bn">উত্তর (বাংলা)</Label>
                  <Textarea
                    id="faq-a-bn"
                    lang="bn"
                    rows={6}
                    value={form.answer_bn ?? ""}
                    onChange={(e) => setForm({ ...form, answer_bn: e.target.value })}
                    placeholder="বাংলায় উত্তর লিখুন।"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="faq-c">
                  Category <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="faq-c"
                  value={form.category ?? ""}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Schedules, App, Tracking"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setForm(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-xl bg-orange-gradient text-primary-foreground font-semibold">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {form.id ? "Save changes" : "Publish"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the question from the public FAQ page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              className="rounded-xl bg-destructive text-destructive-foreground"
            >
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function friendlyError(msg: string): string {
  if (/relation .*faqs.* does not exist/i.test(msg)) {
    return "The 'faqs' table doesn't exist yet. Run the SQL migration in the Supabase Editor first.";
  }
  return msg;
}
