import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserX, Download } from "lucide-react";

interface InactiveUser {
  user_id: string;
  display_name: string | null;
  client_code: string | null;
  last_meal: string;
  days_inactive: number;
}

const AdminInactiveUsers = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<InactiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysThreshold, setDaysThreshold] = useState(14);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchInactiveUsers();
  }, [daysThreshold]);

  const fetchInactiveUsers = async () => {
    setLoading(true);

    // Get all profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, client_code");

    if (!profiles || profiles.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    // Get latest meal transaction per user
    const { data: transactions } = await supabase
      .from("transactions")
      .select("user_id, created_at")
      .eq("type", "meal")
      .order("created_at", { ascending: false });

    const now = new Date();
    const latestMealMap = new Map<string, string>();

    (transactions || []).forEach((tx) => {
      if (!latestMealMap.has(tx.user_id)) {
        latestMealMap.set(tx.user_id, tx.created_at);
      }
    });

    const inactive: InactiveUser[] = [];

    profiles.forEach((p) => {
      const lastMeal = latestMealMap.get(p.user_id);
      if (!lastMeal) return; // Never had a meal — skip

      const lastDate = new Date(lastMeal);
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= daysThreshold) {
        inactive.push({
          user_id: p.user_id,
          display_name: p.display_name,
          client_code: p.client_code,
          last_meal: lastMeal,
          days_inactive: diffDays,
        });
      }
    });

    inactive.sort((a, b) => b.days_inactive - a.days_inactive);
    setUsers(inactive);
    setLoading(false);
  };

  const exportCSV = () => {
    if (users.length === 0) return;
    setExporting(true);

    try {
      const header = "Nome,Código,Última Refeição,Dias Inativo\n";
      const rows = users.map((u) => {
        const name = (u.display_name || "").replace(/,/g, " ");
        const date = new Date(u.last_meal).toLocaleDateString("pt-PT");
        return `${name},${u.client_code || ""},${date},${u.days_inactive}`;
      });

      const csv = header + rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `utilizadores_inativos_${daysThreshold}dias.csv`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  return (
    <section className="border border-border p-6 bg-card mt-6 rounded-2xl">
      <h2 className="font-display text-xl text-foreground mb-4 text-center flex items-center justify-center gap-2">
        <UserX className="w-5 h-5" />
        {t.inactiveUsersTitle as string}
      </h2>

      <div className="flex items-center justify-center gap-3 mb-4">
        <label className="text-xs text-muted-foreground">{t.inactiveDaysLabel as string}</label>
        <select
          value={daysThreshold}
          onChange={(e) => setDaysThreshold(Number(e.target.value))}
          className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
        >
          <option value={7}>7 {t.days as string}</option>
          <option value={14}>14 {t.days as string}</option>
          <option value={30}>30 {t.days as string}</option>
          <option value={60}>60 {t.days as string}</option>
        </select>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground text-center">{t.loading as string}</p>
      ) : users.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center">{t.inactiveUsersEmpty as string}</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground text-center mb-3">
            {(t.inactiveUsersCount as (n: number) => string)(users.length)}
          </p>

          <div className="space-y-2 max-h-72 overflow-y-auto mb-4">
            {users.map((user) => (
              <div key={user.user_id} className="border border-border rounded-xl p-3 bg-background flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user.display_name || (t.noName as string)}
                  </p>
                  {user.client_code && (
                    <p className="text-xs text-muted-foreground">#{user.client_code}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                    {user.days_inactive} {t.days as string}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(user.last_meal)}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={exportCSV}
            disabled={exporting}
            className="w-full py-3 flex items-center justify-center gap-2 border border-border text-foreground text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors rounded-xl disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {t.exportInactiveEmails as string}
          </button>
        </>
      )}
    </section>
  );
};

export default AdminInactiveUsers;
