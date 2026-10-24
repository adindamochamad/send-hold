"use client";

import { useAction } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import styles from "../../sheet.module.css";

type Props = {
  label: string;
  entityType: string;
  name: string;
  entityId?: string;
  onSelect: (name: string, entityId: string) => void;
};

export function EntityPicker({ label, entityType, name, entityId, onSelect }: Props) {
  const searchEntities = useAction(api.folioActions.searchEntities);
  const [query, setQuery] = useState(name);
  const [results, setResults] = useState<Array<{ entity_id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(name);
  }, [name]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchEntities({ query: q, entityType });
      if (!res.ok) {
        setError(res.reason === "rate_limited" ? "Rate limited — wait a minute." : res.reason);
        setResults([]);
        return;
      }
      setError(null);
      setResults(res.results);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, entityType, searchEntities]);

  return (
    <div className={styles.field}>
      <span>{label}</span>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Qloo…"
        aria-describedby={entityId ? `${label}-id` : undefined}
      />
      {entityId ? (
        <span id={`${label}-id`} className={styles.mastheadNote}>
          entity_id: {entityId.slice(0, 12)}…
        </span>
      ) : null}
      {error ? <span className={styles.statusHeld}>{error}</span> : null}
      {results.length > 0 ? (
        <ul className={styles.pickerResults}>
          {results.map((r) => (
            <li key={r.entity_id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(r.name, r.entity_id);
                  setQuery(r.name);
                  setResults([]);
                }}
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
