const LEAD_SUBMITTED_KEY = "lead_submitted";
const DISMISSED_WIDGETS_KEY = "lead_dismissed_widgets";

type LeadSubmittedMap = Record<string, boolean>;
type DismissedWidgetsMap = Record<string, string[]>;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function isLeadSubmitted(sessionId: string): boolean {
  const map = readJson<LeadSubmittedMap>(LEAD_SUBMITTED_KEY, {});
  return Boolean(map[sessionId]);
}

export function markLeadSubmitted(sessionId: string) {
  const map = readJson<LeadSubmittedMap>(LEAD_SUBMITTED_KEY, {});
  map[sessionId] = true;
  writeJson(LEAD_SUBMITTED_KEY, map);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("lead-submitted"));
  }
}

export function isWidgetDismissed(sessionId: string, messageId: string): boolean {
  const map = readJson<DismissedWidgetsMap>(DISMISSED_WIDGETS_KEY, {});
  return map[sessionId]?.includes(messageId) ?? false;
}

export function dismissWidget(sessionId: string, messageId: string) {
  const map = readJson<DismissedWidgetsMap>(DISMISSED_WIDGETS_KEY, {});
  const existing = map[sessionId] ?? [];
  if (!existing.includes(messageId)) {
    map[sessionId] = [...existing, messageId];
    writeJson(DISMISSED_WIDGETS_KEY, map);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("lead-widget-dismissed"));
    }
  }
}

type WidgetMessage = {
  id: string;
  role: string;
  widget?: { type: string };
};

/** Treat unanswered inline widgets as skipped (e.g. user sends a chat message instead). */
export function skipPendingWidgets(
  sessionId: string,
  messages: WidgetMessage[],
  widgetType: "collect_name" | "collect_phone" = "collect_name"
) {
  let changed = false;
  for (const m of messages) {
    if (
      m.role === "assistant" &&
      m.widget?.type === widgetType &&
      !isWidgetDismissed(sessionId, m.id)
    ) {
      const map = readJson<DismissedWidgetsMap>(DISMISSED_WIDGETS_KEY, {});
      const existing = map[sessionId] ?? [];
      if (!existing.includes(m.id)) {
        map[sessionId] = [...existing, m.id];
        writeJson(DISMISSED_WIDGETS_KEY, map);
        changed = true;
      }
    }
  }
  if (changed && typeof window !== "undefined") {
    window.dispatchEvent(new Event("lead-widget-dismissed"));
  }
}
