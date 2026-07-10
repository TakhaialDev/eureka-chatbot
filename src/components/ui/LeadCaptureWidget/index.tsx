"use client";
import useLeadSubmitted from "@/components/hooks/useLeadSubmitted";
import useSubmitLead from "@/lib/tanstack/Leads/useSubmitLead";
import { ChatWidget } from "@/utils/types&schemas/Generic/Chat";
import { dismissWidget, isWidgetDismissed } from "@/utils/types&schemas/leadStorage";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { FaPhoneAlt, FaTimes } from "react-icons/fa";

/* ─── Shared styles ─────────────────────────────────────────────────────── */
const inputCls =
  "w-full bg-white/5 border border-primary-gold/30 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary-gold/75 focus:bg-white/[0.07] transition-all duration-150";
const labelCls =
  "block text-primary-gold/60 text-[10px] font-semibold tracking-[0.12em] uppercase mb-1.5";
const primaryBtnCls =
  "w-full py-3 rounded-xl bg-accent-gold text-text-on-accent font-bold text-sm tracking-wide hover:brightness-110 active:scale-[0.985] disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2";
const skipBtnCls =
  "w-full py-2.5 rounded-xl border border-primary-gold/30 text-primary-gold/80 text-sm hover:bg-white/5 transition-colors";

function LeadCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full max-w-sm ${className}`}>
      <div className="w-full rounded-2xl bg-dark-navy border border-primary-gold/30 shadow-xl overflow-hidden">
        <div className="h-px w-full bg-gradient-to-l from-transparent via-accent-gold to-transparent" />
        {children}
      </div>
    </div>
  );
}

function LeadSuccess({
  message,
  subtitle,
}: {
  message?: string;
  subtitle?: string;
}) {
  return (
    <LeadCard>
      <div
        className="p-6 flex flex-col items-center gap-3 text-center"
        dir="rtl"
      >
        <div className="w-11 h-11 rounded-full border border-primary-gold/60 flex items-center justify-center text-accent-gold text-xl">
          ✓
        </div>
        <p className="text-primary-gold text-sm font-semibold">
          {message ?? "تم تسجيل طلبك بنجاح!"}
        </p>
        {subtitle && (
          <p className="text-white/40 text-xs leading-relaxed">{subtitle}</p>
        )}
      </div>
    </LeadCard>
  );
}

function WidgetPromptBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 md:px-4 py-1 md:py-2 rounded-xl rounded-tl-none bg-primary-gold text-dark-navy text-base w-fit max-w-full shadow-md">
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

const EGYPT_PHONE_ERROR =
  "رقم الموبايل غير صحيح. أدخل 11 رقم يبدأ بـ 01 أو 10 أرقام بدون الصفر";

/** Valid: 01xxxxxxxxx (11 digits) or 1xxxxxxxxx (10 digits, +20 prefix in UI) */
function normalizeEgyptianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^01[0125]\d{8}$/.test(digits)) return digits;
  if (/^1[0125]\d{8}$/.test(digits)) return `0${digits}`;
  return null;
}

function isValidEgyptianPhone(raw: string): boolean {
  return normalizeEgyptianPhone(raw) !== null;
}

function PhoneInput({
  value,
  onChange,
  id = "lc-phone",
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`flex items-stretch border rounded-lg focus-within:border-primary-gold/75 transition-colors bg-white/5 overflow-hidden ${
          error ? "border-red-400/70" : "border-primary-gold/30 focus-within:border-primary-gold/75"
        }`}
      >
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          maxLength={11}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          placeholder="01012345678"
          dir="ltr"
          className="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none"
        />
        <div className="flex items-center gap-1.5 px-3 border-r border-primary-gold/20 shrink-0 select-none">
          <span className="text-accent-gold text-sm font-mono leading-none">+20</span>
          <span role="img" aria-label="مصر" className="text-base leading-none">
            🇪🇬
          </span>
        </div>
      </div>
      {error && (
        <p className="text-red-400/90 text-xs leading-relaxed" dir="rtl">
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Inline widget: collect_name ───────────────────────────────────────── */
function CollectNameWidget({
  sessionId,
  messageId,
  onComplete,
}: {
  sessionId: string;
  messageId: string;
  onComplete: () => void;
}) {
  const [name, setName] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [success, setSuccess] = useState(false);
  const submitLead = useSubmitLead({
    onError: (e) =>
      toast.error(e?.response?.data?.detail || "Could not submit your details"),
  });

  if (success) {
    return (
      <LeadSuccess message={`شكراً، ${submittedName}`} />
    );
  }

  return (
    <LeadCard>
        <form
          className="px-5 pt-4 pb-5 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = name.trim();
            if (!trimmed) return;
            submitLead.mutate(
              {
                session_id: sessionId,
                name: trimmed,
                markAsComplete: false,
              },
              {
                onSuccess: () => {
                  setSubmittedName(trimmed);
                  dismissWidget(sessionId, messageId);
                  setSuccess(true);
                  toast.success(`شكراً، ${trimmed}`);
                  setTimeout(() => onComplete(), 1500);
                },
              }
            );
          }}
        >
          <div>
            <label htmlFor={`name-${messageId}`} className={labelCls}>
              Your name
            </label>
            <input
              id={`name-${messageId}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ahmed"
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={submitLead.isPending || !name.trim()}
            className={primaryBtnCls}
          >
            {submitLead.isPending && (
              <span className="w-3.5 h-3.5 border-2 border-text-on-accent/20 border-t-text-on-accent rounded-full animate-spin" />
            )}
            Submit
          </button>
          <button
            type="button"
            className={skipBtnCls}
            onClick={() => {
              dismissWidget(sessionId, messageId);
              onComplete();
            }}
          >
            Skip
          </button>
        </form>
    </LeadCard>
  );
}

/* ─── Inline widget: collect_phone ──────────────────────────────────────── */
function CollectPhoneWidget({
  sessionId,
  messageId,
  onComplete,
}: {
  sessionId: string;
  messageId: string;
  onComplete: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [success, setSuccess] = useState(false);
  const submitLead = useSubmitLead({
    onSuccess: () => {
      dismissWidget(sessionId, messageId);
      setSuccess(true);
      toast.success("شكراً، هنتواصل معاك قريباً");
      setTimeout(() => onComplete(), 1500);
    },
    onError: (e) =>
      toast.error(e?.response?.data?.detail || "Could not submit your details"),
  });

  if (success) {
    return (
      <LeadSuccess message="شكراً!" subtitle="هنتواصل معاك قريباً" />
    );
  }

  return (
    <LeadCard>
        <form
          className="px-5 pt-4 pb-5 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const normalized = normalizeEgyptianPhone(phone);
            if (!normalized) {
              setPhoneError(EGYPT_PHONE_ERROR);
              toast.error(EGYPT_PHONE_ERROR);
              return;
            }
            submitLead.mutate({
              session_id: sessionId,
              phone: normalized,
              markAsComplete: false,
            });
          }}
        >
          <div>
            <label htmlFor={`phone-${messageId}`} className={labelCls}>
              Mobile number
            </label>
            <PhoneInput
              id={`phone-${messageId}`}
              value={phone}
              onChange={(value) => {
                setPhone(value);
                if (phoneError) setPhoneError("");
              }}
              error={phoneError}
            />
          </div>
          <button
            type="submit"
            disabled={submitLead.isPending || !isValidEgyptianPhone(phone)}
            className={primaryBtnCls}
          >
            {submitLead.isPending && (
              <span className="w-3.5 h-3.5 border-2 border-text-on-accent/20 border-t-text-on-accent rounded-full animate-spin" />
            )}
            Submit
          </button>
          <button
            type="button"
            className={skipBtnCls}
            onClick={() => {
              dismissWidget(sessionId, messageId);
              onComplete();
            }}
          >
            Skip
          </button>
        </form>
    </LeadCard>
  );
}

/* ─── Backend-driven widget renderer (callable from Message) ─────────────── */
export function ChatLeadWidget({
  widget,
  sessionId,
  messageId,
}: {
  widget: ChatWidget;
  sessionId: string;
  messageId: string;
}) {
  const { submitted } = useLeadSubmitted(sessionId);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const refresh = () => setDismissed(isWidgetDismissed(sessionId, messageId));
    refresh();
    window.addEventListener("lead-widget-dismissed", refresh);
    return () => window.removeEventListener("lead-widget-dismissed", refresh);
  }, [sessionId, messageId]);

  if (submitted || dismissed) return null;

  const handleComplete = () => {
    setDismissed(true);
  };

  if (widget.type === "collect_name") {
    return (
      <div className="flex flex-col gap-2 w-full">
        <WidgetPromptBubble>
          What should I call you?
          <br />
          ممكن اعرف اسمك ايه؟
        </WidgetPromptBubble>
        <CollectNameWidget
          sessionId={sessionId}
          messageId={messageId}
          onComplete={handleComplete}
        />
      </div>
    );
  }

  if (widget.type === "collect_phone") {
    return (
      <div className="flex flex-col gap-2 w-full">
        <WidgetPromptBubble>Want us to call you?</WidgetPromptBubble>
        <CollectPhoneWidget
          sessionId={sessionId}
          messageId={messageId}
          onComplete={handleComplete}
        />
      </div>
    );
  }

  return null;
}

/* ─── Full form (floating button) ───────────────────────────────────────── */
export function LeadFullForm({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [success, setSuccess] = useState(false);

  const submitLead = useSubmitLead({
    onSuccess: () => {
      setSuccess(true);
      toast.success("تم تسجيل طلبك بنجاح!");
    },
    onError: (e) =>
      toast.error(e?.response?.data?.detail || "تعذر إرسال البيانات"),
  });

  const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
  const phoneValid = isValidEgyptianPhone(phone);

  if (success) {
    return (
      <div className="p-2">
        <LeadSuccess subtitle="سيتواصل معك فريق المبيعات في أقرب وقت." />
      </div>
    );
  }

  return (
    <div dir="rtl">
      <div className="relative w-full max-w-sm mx-auto rounded-2xl bg-dark-navy border border-primary-gold/30 shadow-2xl overflow-hidden">
        <div className="h-px w-full bg-gradient-to-l from-transparent via-accent-gold to-transparent" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 left-3 z-10 p-1.5 text-primary-gold/60 hover:text-primary-gold transition-colors"
          aria-label="Close"
        >
          <FaTimes size={22} />
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const normalized = normalizeEgyptianPhone(phone);
            if (!name || !normalized) {
              if (!normalized) {
                setPhoneError(EGYPT_PHONE_ERROR);
                toast.error(EGYPT_PHONE_ERROR);
              }
              return;
            }
            submitLead.mutate({
              session_id: sessionId,
              name,
              phone: normalized,
              markAsComplete: true,
            });
          }}
          className="px-5 pt-10 pb-5 flex flex-col gap-4"
        >
          <p className="text-primary-gold text-sm font-semibold text-center pb-1">
            بيانات التواصل
          </p>

          <div>
            <label htmlFor="lc-first" className={labelCls}>
              الاسم الأول
            </label>
            <input
              id="lc-first"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="أحمد"
              dir="rtl"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="lc-last" className={labelCls}>
              اسم العائلة
            </label>
            <input
              id="lc-last"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="علي"
              dir="rtl"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="lc-phone-full" className={labelCls}>
              رقم الموبايل
            </label>
            <PhoneInput
              id="lc-phone-full"
              value={phone}
              onChange={(value) => {
                setPhone(value);
                if (phoneError) setPhoneError("");
              }}
              error={phoneError}
            />
          </div>

          <button
            type="submit"
            disabled={
              submitLead.isPending || !name || !phoneValid
            }
            className={primaryBtnCls}
          >
            {submitLead.isPending && (
              <span className="w-3.5 h-3.5 border-2 border-text-on-accent/20 border-t-text-on-accent rounded-full animate-spin" />
            )}
            تسجيل طلب تواصل
          </button>

          <p className="text-white/25 text-[10px] text-center leading-relaxed -mt-1.5">
            بياناتك ستُعالج بأمان ولن تُرسل لنظام الذكاء الاصطناعي.
          </p>
        </form>
      </div>
    </div>
  );
}

/* ─── Always-visible floating button ──────────────────────────────────────── */
export function LeadFloatingButton({
  sessionId,
  inline = false,
}: {
  sessionId: string;
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { submitted } = useLeadSubmitted(sessionId);

  useEffect(() => setMounted(true), []);

  if (submitted) return null;

  const composerBtnCls =
    "flex items-center justify-center gap-1.5 h-11 px-3 rounded-full bg-dark-navy text-accent-gold border border-accent-gold/50 shadow-sm hover:bg-secondary-blue hover:border-accent-gold transition-all duration-150 shrink-0 text-xs font-bold";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={inline ? composerBtnCls : "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-primary-gold border border-primary-gold/30 hover:bg-primary-gold/10 hover:border-primary-gold/50 transition-all duration-150 shrink-0"}
        aria-label="Contact us"
      >
        <FaPhoneAlt size={14} />
        <span className="tracking-wide whitespace-nowrap">تواصل معنا</span>
      </button>

      {open && mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-md max-h-[90dvh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <LeadFullForm sessionId={sessionId} onClose={() => setOpen(false)} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
