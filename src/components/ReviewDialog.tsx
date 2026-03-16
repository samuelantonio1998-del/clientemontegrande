import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ReviewDialogProps {
  open: boolean;
  onClose: () => void;
  transactionId: string;
  onReviewSubmitted: () => void;
}

const FaceSvg = ({ rating, size = 48 }: { rating: number; size?: number }) => {
  const colors: Record<number, string> = {
    1: "#c0392b",
    2: "#e67e22",
    3: "#f1c40f",
    4: "#a8d648",
    5: "#27ae60",
  };
  const fill = colors[rating] || "#ccc";

  // Mouth paths for each rating
  const mouths: Record<number, JSX.Element> = {
    1: (
      <>
        <path d="M16 34 C16 30, 32 30, 32 34" stroke="#333" strokeWidth="1.5" fill="none" />
        <rect x="18" y="34" width="12" height="4" rx="1" fill="#333" opacity="0.5" />
      </>
    ),
    2: <path d="M16 34 C20 30, 28 30, 32 34" stroke="#333" strokeWidth="1.5" fill="none" />,
    3: <line x1="16" y1="33" x2="32" y2="33" stroke="#333" strokeWidth="1.5" />,
    4: <path d="M16 31 C20 35, 28 35, 32 31" stroke="#333" strokeWidth="1.5" fill="none" />,
    5: (
      <>
        <path d="M16 31 C20 37, 28 37, 32 31" stroke="#333" strokeWidth="1.5" fill="none" />
        <rect x="19" y="32" width="10" height="3" rx="1" fill="#333" opacity="0.4" />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="22" fill={fill} />
      <circle cx="17" cy="21" r="2.5" fill="#333" />
      <circle cx="31" cy="21" r="2.5" fill="#333" />
      {mouths[rating]}
    </svg>
  );
};

const faces = [
  { rating: 1, selectedBorder: "border-[#c0392b]", selectedBg: "bg-[#c0392b]/10" },
  { rating: 2, selectedBorder: "border-[#e67e22]", selectedBg: "bg-[#e67e22]/10" },
  { rating: 3, selectedBorder: "border-[#f1c40f]", selectedBg: "bg-[#f1c40f]/10" },
  { rating: 4, selectedBorder: "border-[#a8d648]", selectedBg: "bg-[#a8d648]/10" },
  { rating: 5, selectedBorder: "border-[#27ae60]", selectedBg: "bg-[#27ae60]/10" },
];

const ReviewDialog = ({ open, onClose, transactionId, onReviewSubmitted }: ReviewDialogProps) => {
  const { t } = useLanguage();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-review", {
        body: { transaction_id: transactionId, rating, comment },
      });

      if (error) throw error;

      const pts = data?.points_awarded ?? 1.5;
      toast({
        title: (t.reviewSubmitted as string),
        description: `+${pts} ${t.pts as string}`,
      });

      onReviewSubmitted();
      handleClose();
    } catch {
      toast({
        title: (t.reviewError as string),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(null);
    setComment("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.reviewTitle as string}</DialogTitle>
          <DialogDescription>{t.reviewSubtitle as string}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-3 py-4">
          {faces.map((face) => (
            <button
              key={face.rating}
              onClick={() => setRating(face.rating)}
              className={`rounded-full border-2 p-1 transition-all ${
                rating === face.rating
                  ? `${face.selectedBorder} ${face.selectedBg} scale-110 shadow-md`
                  : "border-transparent hover:scale-105"
              }`}
            >
              <FaceSvg rating={face.rating} size={44} />
            </button>
          ))}
        </div>

        <Textarea
          placeholder={t.reviewPlaceholder as string}
          value={comment}
          onChange={(e) => setComment(e.target.value.substring(0, 500))}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {t.reviewPointsHint as string}
        </p>

        <Button
          onClick={handleSubmit}
          disabled={!rating || submitting}
          className="w-full"
        >
          {submitting ? (t.loading as string) : (t.confirmReview as string)}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
