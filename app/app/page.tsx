"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import styles from "../sheet.module.css";

export default function AppHomePage() {
  const plans = useQuery(api.plans.listMine);
  const { signOut } = useAuthActions();

  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <div className={styles.mastheadRow}>
          <p className={styles.mastheadTitle}>Your folios</p>
          <p className={styles.mastheadNote}>
            <Link href="/">Hackathon demo</Link>
          </p>
        </div>
        <div className={styles.controlRow}>
          <Link href="/app/plans/new" className={styles.sendOn}>
            New folio
          </Link>
          <button type="button" className={styles.edition} onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <main className={styles.sheet}>
        <ul className={styles.planList}>
          {(plans ?? []).map((plan: { _id: string; label: string; city: string; headliner: string }) => (
            <li key={plan._id}>
              <Link href={`/app/plans/${plan._id}`}>
                <strong>{plan.label}</strong> — {plan.city} · {plan.headliner}
              </Link>
            </li>
          ))}
        </ul>
        {plans && plans.length === 0 ? (
          <p className={styles.outcome}>No folios yet. Create one to evaluate with Qloo.</p>
        ) : null}
      </main>
    </div>
  );
}
