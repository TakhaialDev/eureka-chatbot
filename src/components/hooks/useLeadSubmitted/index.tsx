"use client";
import { isLeadSubmitted } from "@/utils/types&schemas/leadStorage";
import { useCallback, useEffect, useState } from "react";

/** Tracks whether the user completed the full contact form — not partial name/phone widgets. */
export default function useLeadSubmitted(sessionId: string | null) {
  const [submitted, setSubmitted] = useState(false);

  const refresh = useCallback(() => {
    if (!sessionId) {
      setSubmitted(false);
      return;
    }
    setSubmitted(isLeadSubmitted(sessionId));
  }, [sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "lead_submitted") refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const markSubmitted = useCallback(() => {
    setSubmitted(true);
    window.dispatchEvent(new Event("lead-submitted"));
  }, []);

  useEffect(() => {
    const onLeadSubmitted = () => refresh();
    window.addEventListener("lead-submitted", onLeadSubmitted);
    return () => window.removeEventListener("lead-submitted", onLeadSubmitted);
  }, [refresh]);

  return { submitted, refresh, markSubmitted };
}
