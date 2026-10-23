"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { plans, type Plan, type SheetStatus } from "./plans";
import type {
  LineVerdict,
  PlanEvaluation,
  SendLogEntry,
  TraceStep,
} from "../lib/send-hold-types";
import { evaluatePlanAction, sendPlanAction } from "./actions/send-hold";
import styles from "./sheet.module.css";

type SheetProps = {
  qlooLive: boolean;
};

export function Sheet({ qlooLive }: SheetProps) {
  const [planId, setPlanId] = useState(plans[0].id);
  const [evaluation, setEvaluation] = useState<PlanEvaluation | null>(null);
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [sendLog, setSendLog] = useState<SendLogEntry[]>([]);
  const [pending, startTransition] = useTransition();
  const plan = plans.find((item) => item.id === planId) ?? plans[0];

  const loadEvaluation = useCallback(() => {
    startTransition(async () => {
      const result = await evaluatePlanAction(planId);
      if (result) {
        setEvaluation(result);
      }
    });
  }, [planId]);

  useEffect(() => {
    loadEvaluation();
  }, [loadEvaluation]);

  const status: SheetStatus | null = evaluation?.status ?? null;
  const sendAllowed = evaluation?.status === "cleared";

  const fixtureBanner = pending
    ? "Evaluating…"
    : evaluation?.source === "fixture"
      ? "Local fixture. Names are not a Qloo result."
      : qlooLive
        ? "Live Qloo evaluation."
        : "Local fixture. Names are not a Qloo result.";

  function onPlanChange(id: string) {
    setSendMessage(null);
    setEvaluation(null);
    setPlanId(id);
  }

  function onSend() {
    if (!sendAllowed) {
      return;
    }
    setSendMessage(null);
    startTransition(async () => {
      const result = await sendPlanAction(planId);
      setEvaluation(result.evaluation);
      setSendMessage(result.message);
      if (result.ok) {
        setSendLog((prev) => [result.log, ...prev]);
      }
    });
  }

  const displayLines: LineVerdict[] =
    evaluation?.lines ??
    plan.lines.map((line) => ({
      role: line.role,
      name: line.name,
      inSet: true,
      held: false,
    }));

  const trace: TraceStep[] = evaluation?.trace ?? [
    { id: "search", label: `search · ${plan.headliner}` },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <div className={styles.mastheadRow}>
          <p className={styles.mastheadTitle}>Send Hold</p>
          <p className={styles.mastheadNote} aria-live="polite">{fixtureBanner}</p>
        </div>
        <nav className={styles.editions} aria-label="Plans">
          {plans.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === plan.id ? styles.editionOn : styles.edition}
              aria-current={item.id === plan.id ? "true" : undefined}
              onClick={() => onPlanChange(item.id)}
            >
              <span className={styles.editionCity}>{item.city}</span>
              <span className={styles.editionName}>{item.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <article
        className={`${styles.briefing} ${pending ? styles.briefingPending : ""}`}
        key={plan.id}
      >
        <StatusBanner status={status} />

        <header className={styles.listingHead}>
          <p className={styles.listingMeta}>
            <span>{plan.day}</span>
            <span aria-hidden="true">·</span>
            <span>{plan.city}</span>
          </p>
          <h1 className={styles.listingTitle}>{plan.headliner}</h1>
        </header>

        <Register plan={plan} lines={displayLines} status={status} />

        {status === "silent" ? (
          <>
            <p className={styles.outcome}>Qloo did not answer. Nothing was sent.</p>
            {plan.negativeControlNote ? (
              <p className={styles.negativeControl}>{plan.negativeControlNote}</p>
            ) : null}
          </>
        ) : status === "held" ? (
          <p className={styles.outcome}>
            This line does not send. It was the confident one, and it is not in the
            headliner&apos;s affiliated set.
          </p>
        ) : null}

        <footer className={styles.actionsRow}>
          <details className={styles.audit} open>
            <summary className={styles.auditSummary}>Qloo trace</summary>
            <TraceList steps={trace} />
          </details>
          <Control
            sendAllowed={sendAllowed}
            status={status}
            pending={pending}
            onSend={onSend}
            sendMessage={sendMessage}
          />
          {sendLog.length > 0 ? <SendLogPanel entries={sendLog} /> : null}
        </footer>
      </article>
    </div>
  );
}

function StatusBanner({ status }: { status: SheetStatus | null }) {
  const copy =
    status === null
      ? "Evaluating this plan."
      : status === "held"
        ? "This plan is held."
        : status === "silent"
          ? "Qloo did not answer."
          : "This plan is cleared to send.";

  return (
    <p
      className={`${styles.statusBanner} ${bannerClass(status)}`}
      role="status"
      aria-live="polite"
    >
      {copy}
    </p>
  );
}

function bannerClass(s: SheetStatus | null): string {
  if (s === null) return styles.bannerSilent;
  if (s === "held") return styles.bannerHeld;
  if (s === "silent") return styles.bannerSilent;
  return styles.bannerCleared;
}

function Register({
  plan,
  lines,
  status,
}: {
  plan: Plan;
  lines: LineVerdict[];
  status: SheetStatus | null;
}) {
  const silent = status === "silent";
  const cleared = status === "cleared";
  const pendingEval = status === null;

  return (
    <div className={styles.register}>
      <section className={styles.panel} aria-labelledby="draft-heading">
        <h2 id="draft-heading" className={styles.panelTitle}>Would have sent</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Line</th>
              <th scope="col">Name</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {plan.lines.map((line) => (
              <tr key={line.role}>
                <th scope="row">{line.role}</th>
                <td>{silent ? "—" : line.name}</td>
                <td>{silent ? "No answer" : "Draft"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={styles.panel} aria-labelledby="result-heading">
        <h2 id="result-heading" className={styles.panelTitle}>
          {pendingEval ? "Waiting on Qloo" : cleared ? "Cleared to send" : "After the hold"}
        </h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Line</th>
              <th scope="col">Name</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const held = !pendingEval && !line.inSet && !silent;
              return (
                <tr key={line.role} className={held ? styles.rowHeld : undefined}>
                  <th scope="row">{line.role}</th>
                  <td>
                    {silent ? (
                      "—"
                    ) : held ? (
                      <span className={styles.replacement}>
                        <s>{line.name}</s>
                        {line.replacement ? (
                          <span className={styles.alt}>In its place, {line.replacement}</span>
                        ) : null}
                      </span>
                    ) : (
                      line.name
                    )}
                  </td>
                  <td>
                    {pendingEval ? "Evaluating" : silent ? "No answer" : line.inSet ? "In set" : "Held"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Control({
  sendAllowed,
  status,
  pending,
  onSend,
  sendMessage,
}: {
  sendAllowed: boolean;
  status: SheetStatus | null;
  pending: boolean;
  onSend: () => void;
  sendMessage: string | null;
}) {
  return (
    <div className={styles.control}>
      {sendAllowed ? (
        <button type="button" className={styles.send} onClick={onSend} disabled={pending}>
          Send plan
        </button>
      ) : (
        <button type="button" className={styles.blocked} disabled aria-disabled="true">
          {status === null ? "Evaluating" : "Cannot send"}
        </button>
      )}
      {sendMessage ? (
        <p className={styles.feedback} role="status" aria-live="polite">
          {sendMessage}
        </p>
      ) : null}
    </div>
  );
}

function SendLogPanel({ entries }: { entries: SendLogEntry[] }) {
  return (
    <section className={styles.sendLog} aria-labelledby="send-log-heading">
      <h2 id="send-log-heading" className={styles.panelTitle}>Send log</h2>
      <ol className={styles.sendLogList}>
        {entries.map((entry) => (
          <li key={`${entry.at}-${entry.planId}`}>
            <time dateTime={entry.at}>{formatLogTime(entry.at)}</time>
            <span>
              {entry.headliner} · {entry.city}
            </span>
            <span className={styles.sendLogMeta}>
              {entry.planId} · {entry.source}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function formatLogTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function TraceList({ steps }: { steps: TraceStep[] }) {
  return (
    <ol className={styles.trace}>
      {steps.map((step) => (
        <li
          key={step.id}
          className={
            step.label.includes("not in set") || step.label.includes("no answer")
              ? styles.traceWarn
              : undefined
          }
        >
          {step.label}
        </li>
      ))}
    </ol>
  );
}
