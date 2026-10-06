import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Daily email triggers (called by pg_cron at 08:00 UTC).
 * Auth: Bearer token must match vault 'cron_secret' (via get_cron_secret RPC).
 * Sends via the send-email function using the service role key.
 */

const DAY = 86_400_000;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const provided = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const { data: expected, error: secretErr } = await supabase.rpc("get_cron_secret");
  if (secretErr || !expected || !provided || provided !== expected) {
    console.error("email-triggers-daily auth failed", { secretErr });
    return json({ error: "Unauthorized" }, 401);
  }

  const errors: string[] = [];
  let sent = 0;
  let skipped = 0;

  try {
    const now = Date.now();

    // Profiles
    const profiles: any[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, total_points, buffet_available, buffet_earned_at, discount_available, discount_earned_at, birth_date, created_at")
        .range(from, from + 999);
      if (error) throw new Error("profiles: " + error.message);
      profiles.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }

    // Email log (last 365 days) -> latest send per user+template
    const lastSent = new Map<string, number>();
    const since = new Date(now - 366 * DAY).toISOString();
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("email_log")
        .select("user_id, template, sent_at")
        .gte("sent_at", since)
        .range(from, from + 999);
      if (error) throw new Error("email_log: " + error.message);
      for (const r of data ?? []) {
        if (!r.user_id || !r.sent_at) continue;
        const k = `${r.user_id}:${r.template}`;
        const t = new Date(r.sent_at).getTime();
        if (!lastSent.has(k) || lastSent.get(k)! < t) lastSent.set(k, t);
      }
      if (!data || data.length < 1000) break;
    }

    // Users with transactions in the last 21 days
    const activeUsers = new Set<string>();
    const since21 = new Date(now - 21 * DAY).toISOString();
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("transactions")
        .select("user_id")
        .gte("created_at", since21)
        .range(from, from + 999);
      if (error) throw new Error("transactions: " + error.message);
      for (const r of data ?? []) activeUsers.add(r.user_id);
      if (!data || data.length < 1000) break;
    }

    // Emails from auth admin API
    const emails = new Map<string, string>();
    for (let page = 1; ; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error("listUsers: " + error.message);
      for (const u of data.users) if (u.email) emails.set(u.id, u.email);
      if (data.users.length < 1000) break;
    }

    // Today's date in Lisbon
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date(now)).split("-");
    const [yearL, monthL, dayL] = parts;
    const yearStart = new Date(`${yearL}-01-01T00:00:00Z`).getTime();

    const recentWithin = (uid: string, tpl: string, days: number) => {
      const t = lastSent.get(`${uid}:${tpl}`);
      return t !== undefined && t > now - days * DAY;
    };
    const olderThan = (iso: string | null, days: number) =>
      !!iso && new Date(iso).getTime() < now - days * DAY;

    const send = async (uid: string, to: string, template: string, variables: Record<string, unknown>) => {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ to, template, variables, user_id: uid }),
        });
        const data = await res.json().catch(() => ({}));
        if (data?.success) {
          sent++;
          lastSent.set(`${uid}:${template}`, Date.now());
        } else {
          errors.push(`${template}:${uid}:${data?.error ?? res.status}`);
        }
      } catch (e) {
        errors.push(`${template}:${uid}:${(e as Error).message}`);
      }
      await sleep(600); // respect Resend rate limit
    };

    for (const p of profiles) {
      const uid = p.user_id as string;
      const nome = (p.display_name ?? "").trim();
      const email = emails.get(uid) ?? "";
      if (!nome || !email) { skipped++; continue; }

      const points = Number(p.total_points) || 0;
      const jobs: Array<[string, Record<string, unknown>]> = [];

      // (A) buffet
      if (p.buffet_available && olderThan(p.buffet_earned_at, 7) && !recentWithin(uid, "buffet_available", 14)) {
        jobs.push(["buffet_available", { nome, pontos: points }]);
      }
      // (B) discount
      if (p.discount_available && olderThan(p.discount_earned_at, 7) && !recentWithin(uid, "discount_available", 14)) {
        jobs.push(["discount_available", { nome, pontos: points }]);
      }
      // (C) milestone
      if (points >= 150 && points < 200 && !recentWithin(uid, "points_milestone", 30)) {
        jobs.push(["points_milestone", { nome, pontos: points, faltam: Math.round((200 - points) * 10) / 10 }]);
      }
      // (D) birthday (Lisbon date), max once per calendar year
      if (p.birth_date) {
        const [, bm, bd] = String(p.birth_date).split("-");
        const lastB = lastSent.get(`${uid}:birthday`);
        if (bm === monthL && bd === dayL && !(lastB !== undefined && lastB >= yearStart)) {
          jobs.push(["birthday", { nome, pontos: points }]);
        }
      }
      // (E) inactive — skip accounts younger than 21 days
      if (!activeUsers.has(uid) && olderThan(p.created_at, 21) && !recentWithin(uid, "inactive", 60)) {
        jobs.push(["inactive", { nome, pontos: points }]);
      }

      if (jobs.length === 0) { skipped++; continue; }
      for (const [tpl, vars] of jobs) await send(uid, email, tpl, vars);
    }

    console.log("email-triggers-daily done", { sent, skipped, errors: errors.length });
    return json({ sent, skipped, errors });
  } catch (e) {
    console.error("email-triggers-daily failure", e);
    errors.push((e as Error).message);
    return json({ sent, skipped, errors }, 500);
  }
});
