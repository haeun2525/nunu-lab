"use client";

import { useCallback, useEffect, useState } from "react";
import { useLang } from "./LangProvider";
import type { Comment } from "@/lib/db";

export default function Comments({
  scope,
  slug,
}: {
  scope: "project" | "guestbook";
  slug: string;
}) {
  const { t, lang } = useLang();
  const [rows, setRows] = useState<Comment[] | null>(null);
  const [name, setName] = useState("");
  const [anon, setAnon] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/comments?scope=${scope}&slug=${encodeURIComponent(slug)}`,
        { cache: "no-store" },
      );
      const j = await r.json();
      setRows(j.comments ?? []);
    } catch {
      setRows([]);
    }
  }, [scope, slug]);

  useEffect(() => {
    load();
  }, [load]);

  const canSend = body.trim().length > 0 && (anon || name.trim().length > 0) && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    if (body.length > 2000) {
      setErr(t.tooLong);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, slug, name, anonymous: anon, body }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      setRows((prev) => [j.comment, ...(prev ?? [])]);
      setBody("");
    } catch {
      setErr(t.failed);
    } finally {
      setBusy(false);
    }
  };

  const when = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <form className="cform" onSubmit={submit}>
        <div className="cform-row">
          <input
            type="text"
            value={anon ? "" : name}
            disabled={anon}
            onChange={(e) => setName(e.target.value)}
            placeholder={anon ? t.anonName : t.namePlaceholder}
            maxLength={40}
          />
          <label className="anon">
            <input
              type="checkbox"
              checked={anon}
              onChange={(e) => setAnon(e.target.checked)}
            />
            {t.anonymous}
          </label>
          <button className="send" type="submit" disabled={!canSend}>
            {busy ? t.sending : t.submit}
          </button>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t.bodyPlaceholder}
          maxLength={2000}
        />
        {err && (
          <p style={{ marginTop: 10, fontSize: 11, color: "#f472b6" }}>{err}</p>
        )}
      </form>

      <div className="clist">
        {rows === null ? null : rows.length === 0 ? (
          <p className="empty">{t.emptyComments}</p>
        ) : (
          rows.map((c) => (
            <div className="citem" key={c.id}>
              <img className="cava" src="/icons/avatar.png" alt="" />
              <div className="cbody-col">
                <div className="who">
                  <b>{c.anonymous || !c.name ? t.anonName : c.name}</b>
                  <span>{when(c.created_at)}</span>
                </div>
                <p>{c.body}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
