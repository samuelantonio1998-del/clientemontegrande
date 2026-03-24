import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star, MessageSquare } from "lucide-react";

interface ReviewWithProfile {
  id: string;
  rating: number;
  comment: string | null;
  points_awarded: number;
  created_at: string;
  user_id: string;
  profile?: { display_name: string | null; client_code: string | null };
}

const AdminReviews = () => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, comment, points_awarded, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data || data.length === 0) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.map((r) => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, client_code")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    setReviews(
      data.map((r) => ({
        ...r,
        profile: profileMap.get(r.user_id) || undefined,
      }))
    );
    setLoading(false);
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  return (
    <section className="border border-border p-6 bg-card mt-6 rounded-2xl">
      <h2 className="font-display text-xl text-foreground mb-4 text-center flex items-center justify-center gap-2">
        <MessageSquare className="w-5 h-5" />
        {t.adminReviewsTitle as string}
      </h2>

      {loading ? (
        <p className="text-xs text-muted-foreground text-center">{t.loading as string}</p>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center">{t.adminReviewsEmpty as string}</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {reviews.map((review) => (
            <div key={review.id} className="border border-border rounded-xl p-4 bg-background">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {review.profile?.display_name || t.noName as string}
                  </p>
                  {review.profile?.client_code && (
                    <p className="text-xs text-muted-foreground">#{review.profile.client_code}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="mb-1">{renderStars(review.rating)}</div>
                  <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground mt-2 italic">"{review.comment}"</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                +{review.points_awarded} {t.pts as string}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminReviews;
