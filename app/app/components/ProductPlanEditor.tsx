"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { ROLE_ENTITY_TYPE } from "../../../lib/plan-evaluation-core";
import type { PlanLineRole } from "../../../lib/plan-types";
import type { SheetStatus } from "../../../lib/plan-types";
import type { LineVerdict, PlanEvaluation } from "../../../lib/send-hold-types";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import styles from "../../sheet.module.css";
import { EntityPicker } from "./EntityPicker";

const ROLES: PlanLineRole[] = ["Support", "Dinner", "Drink"];

type LineDraft = {
  role: PlanLineRole;
  name: string;
  entityId?: string;
  entityType: string;
};

type Props = {
  planId?: Id<"plans">;
};

function defaultLines(): LineDraft[] {
  return ROLES.map((role) => ({
    role,
    name: "",
    entityType: ROLE_ENTITY_TYPE[role],
  }));
}

export function ProductPlanEditor({ planId }: Props) {
  const router = useRouter();
  const bundle = useQuery(api.plans.getWithLines, planId ? { planId } : "skip");
  const evaluations = useQuery(api.plans.listEvaluations, planId ? { planId } : "skip");
  const sends = useQuery(api.plans.listSends, planId ? { planId } : "skip");
  const createPlan = useMutation(api.plans.create);
  const updatePlan = useMutation(api.plans.update);
  const applyReplacement = useMutation(api.plans.applyLineReplacement);
  const evaluate = useAction(api.folioActions.evaluateUserPlan);
  const send = useAction(api.folioActions.sendUserPlan);

  const [label, setLabel] = useState("My night");
  const [day, setDay] = useState("Friday");
  const [city, setCity] = useState("");
  const [headliner, setHeadliner] = useState("");
  const [headlinerEntityId, setHeadlinerEntityId] = useState<string | undefined>();
  const [notifyEmail, setNotifyEmail] = useState("");
  const [lines, setLines] = useState<LineDraft[]>(defaultLines);
  const [evaluation, setEvaluation] = useState<PlanEvaluation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!bundle) {
      return;
    }
    setLabel(bundle.plan.label);
    setDay(bundle.plan.day);
    setCity(bundle.plan.city);
    setHeadliner(bundle.plan.headliner);
    setHeadlinerEntityId(bundle.plan.headlinerEntityId);
    setNotifyEmail(bundle.plan.notifyEmail);
    setLines(
      bundle.lines.map((l: { role: PlanLineRole; name: string; entityId?: string; entityType: string }) => ({
        role: l.role,
        name: l.name,
        entityId: l.entityId,
        entityType: l.entityType,
      })),
    );
  }, [bundle]);

  const status: SheetStatus | null = evaluation?.status ?? null;
  const sendAllowed = evaluation?.status === "cleared";

  const save = useCallback(async () => {
    const payload = {
      label,
      day,
      city,
      headliner,
      headlinerEntityId,
      notifyEmail,
      lines,
    };
    if (planId) {
      await updatePlan({ planId, ...payload });
      return planId;
    }
    const id = await createPlan(payload);
    router.replace(`/app/plans/${id}`);
    return id;
  }, [planId, label, day, city, headliner, headlinerEntityId, notifyEmail, lines, createPlan, updatePlan, router]);

  function onEvaluate() {
    setMessage(null);
    startTransition(async () => {
      const id = planId ?? (await save());
      const result = await evaluate({ planId: id });
      setEvaluation(result.evaluation);
    });
  }

  function onSend() {
    if (!planId || !sendAllowed) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await send({ planId });
      setEvaluation(result.evaluation);
      setMessage(result.message);
    });
  }

  function applyAlt(line: LineVerdict) {
    if (!planId || !line.replacement || !line.replacementEntityId) {
      return;
    }
    const entityType = ROLE_ENTITY_TYPE[line.role];
    startTransition(async () => {
      await applyReplacement({
        planId,
        role: line.role,
        name: line.replacement!,
        entityId: line.replacementEntityId!,
        entityType,
      });
      setMessage(`Applied alt to ${line.role}`);
    });
  }

  const displayLines: LineVerdict[] =
    evaluation?.lines ??
    lines.map((line) => ({
      role: line.role,
      name: line.name || "—",
      inSet: true,
      held: false,
    }));

  const trace = evaluation?.trace ?? [{ id: "search", label: `search · ${headliner || "…"}` }];

  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <div className={styles.mastheadRow}>
          <p className={styles.mastheadTitle}>Send Hold · Product</p>
          <p className={styles.mastheadNote}>
            <Link href="/app">All folios</Link> · <Link href="/">Demo</Link>
          </p>
        </div>
      </header>

      <main className={styles.sheet}>
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Folio</h2>
          <label className={styles.field}>
            <span>Label</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Day</span>
            <input value={day} onChange={(e) => setDay(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>City</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} required />
          </label>
          <EntityPicker
            label="Headliner (artist)"
            entityType="urn:entity:artist"
            name={headliner}
            entityId={headlinerEntityId}
            onSelect={(name, id) => {
              setHeadliner(name);
              setHeadlinerEntityId(id);
            }}
          />
          <label className={styles.field}>
            <span>Notify email (Resend)</span>
            <input
              type="email"
              required
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
            />
          </label>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Lines</h2>
          {lines.map((line, index) => (
            <EntityPicker
              key={line.role}
              label={line.role}
              entityType={line.entityType}
              name={line.name}
              entityId={line.entityId}
              onSelect={(name, id) => {
                setLines((prev) => {
                  const next = [...prev];
                  next[index] = { ...next[index], name, entityId: id };
                  return next;
                });
              }}
            />
          ))}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Evaluation</h2>
          <p className={styles.outcome}>
            {pending && !evaluation
              ? "Evaluating this plan."
              : status === "held"
                ? "This plan is held."
                : status === "silent"
                  ? "No answer from Qloo."
                  : status === "cleared"
                    ? "Cleared — send allowed."
                    : "Save and evaluate."}
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Line</th>
                <th>Set</th>
              </tr>
            </thead>
            <tbody>
              {displayLines.map((line) => (
                <tr key={line.role} className={line.held ? styles.rowHeld : undefined}>
                  <th scope="row">{line.role}</th>
                  <td>
                    <div className={styles.replacement}>
                      <span>{line.name}</span>
                      {line.replacement ? (
                        <span className={styles.alt}>
                          Alt: {line.replacement}
                          {planId && line.replacementEntityId ? (
                            <button
                              type="button"
                              className={styles.edition}
                              onClick={() => applyAlt(line)}
                            >
                              Apply
                            </button>
                          ) : null}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>{line.inSet ? "In set" : "Held"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <details className={styles.audit} open>
            <summary className={styles.auditSummary}>Trace</summary>
            <ol className={styles.trace}>
              {trace.map((step) => (
                <li key={step.id}>{step.label}</li>
              ))}
            </ol>
          </details>
          <div className={styles.actionsRow}>
            <div className={styles.control}>
              <button type="button" className={styles.sendOn} onClick={onEvaluate} disabled={pending}>
                {pending ? "Working…" : "Evaluate"}
              </button>
              <button
                type="button"
                className={sendAllowed ? styles.send : styles.blocked}
                onClick={onSend}
                disabled={!sendAllowed || pending || !planId}
              >
                {sendAllowed ? "Send plan" : "Cannot send"}
              </button>
              {message ? <p className={styles.feedback}>{message}</p> : null}
            </div>
          </div>
        </section>

        {planId && evaluations && evaluations.length > 0 ? (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>History · evaluations</h2>
            <ul className={styles.sendLogList}>
              {evaluations.slice(0, 8).map((row: { _id: string; createdAt: number; status: string; source: string }) => (
                <li key={row._id}>
                  <time dateTime={new Date(row.createdAt).toISOString()}>
                    {new Date(row.createdAt).toLocaleString()}
                  </time>
                  <span>{row.status}</span>
                  <span className={styles.sendLogMeta}>{row.source}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {planId && sends && sends.length > 0 ? (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>History · sends</h2>
            <ul className={styles.sendLogList}>
              {sends.slice(0, 8).map((row: { _id: string; createdAt: number; ok: boolean; to: string; error?: string }) => (
                <li key={row._id}>
                  <time dateTime={new Date(row.createdAt).toISOString()}>
                    {new Date(row.createdAt).toLocaleString()}
                  </time>
                  <span>{row.ok ? "sent" : "failed"}</span>
                  <span className={styles.sendLogMeta}>{row.to}</span>
                  {row.error ? <span className={styles.statusHeld}>{row.error}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
