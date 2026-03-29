import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertTriangle, CheckCircle, Trash2 } from "lucide-react";

interface ReportWithProfile {
  id: string;
  message: string;
  status: string;
  created_at: string;
  user_id: string;
  resolved_at: string | null;
  profile?: { display_name: string | null; client_code: string | null };
}

const AdminReports = () => {
  const { t } = useLanguage();
  const [reports, setReports] = useState<ReportWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("problem_reports" as any)
      .select("id, message, status, created_at, user_id, resolved_at")
      .order("created_at", { ascending: false })
      .limit(50) as any;

    if (!data || data.length === 0) {
      setReports([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.map((r: any) => r.user_id))] as string[];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, client_code")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    setReports(
      data.map((r: any) => ({
        ...r,
        profile: profileMap.get(r.user_id) || undefined,
      }))
    );
    setLoading(false);
  };

  const markResolved = async (id: string) => {
    await (supabase
      .from("problem_reports" as any)
      .update({ status: "resolved", resolved_at: new Date().toISOString() } as any)
      .eq("id", id) as any);
    fetchReports();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <section className="border border-border p-6 bg-card mt-6 rounded-2xl">
      <h2 className="font-display text-xl text-foreground mb-4 text-center flex items-center justify-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        {t.adminReportsTitle as string}
      </h2>

      {loading ? (
        <p className="text-xs text-muted-foreground text-center">{t.loading as string}</p>
      ) : reports.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center">{t.adminReportsEmpty as string}</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {reports.map((report) => (
            <div key={report.id} className={`border rounded-xl p-4 bg-background ${report.status === "open" ? "border-destructive/30" : "border-border"}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {report.profile?.display_name || t.noName as string}
                  </p>
                  {report.profile?.client_code && (
                    <p className="text-xs text-muted-foreground">#{report.profile.client_code}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${report.status === "open" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                    {report.status === "open" ? t.reportOpen as string : t.reportResolved as string}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(report.created_at)}</p>
                </div>
              </div>
              <p className="text-sm text-foreground mt-2">{report.message}</p>
              {report.status === "open" && (
                <button
                  onClick={() => markResolved(report.id)}
                  className="mt-3 text-xs flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t.reportMarkResolved as string}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminReports;
