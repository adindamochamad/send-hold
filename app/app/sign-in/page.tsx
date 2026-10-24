"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../../sheet.module.css";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signIn("password", { email, password, flow: mode });
      router.push("/app");
    } catch {
      setError("Could not sign in. Check email and password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <p className={styles.mastheadTitle}>Send Hold · Product</p>
        <p className={styles.mastheadNote}>Convex Auth · your folios</p>
      </header>
      <main className={styles.sheet}>
        <form onSubmit={onSubmit} className={styles.panel}>
          <h1 className={styles.panelTitle}>{mode === "signIn" ? "Sign in" : "Create account"}</h1>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className={styles.field}>
            <span>Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            />
          </label>
          {error ? <p className={styles.statusHeld}>{error}</p> : null}
          <div className={styles.controlRow}>
            <button type="submit" className={styles.sendOn} disabled={pending}>
              {pending ? "Working…" : mode === "signIn" ? "Sign in" : "Sign up"}
            </button>
            <button
              type="button"
              className={styles.edition}
              onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
            >
              {mode === "signIn" ? "Need an account?" : "Have an account?"}
            </button>
          </div>
          <p className={styles.mastheadNote}>
            <Link href="/">Back to hackathon demo</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
