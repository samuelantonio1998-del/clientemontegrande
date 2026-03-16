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

const faces = [
  { rating: 1, emoji: "😡", color: "bg-red-500/20 border-red-500 text-red-500" },
  { rating: 2, emoji: "😠", color: "bg-orange-500/20 border-orange-500 text-orange-500" },
  { rating: 3, emoji: "😐", color: "bg-yellow-500/20 border-yellow-500 text-yellow-500" },
  { rating: 4, emoji: "😊", color: "bg-lime-500/20 border-lime-500 text-lime-500" },
  { rating: 5, emoji: "😍", color: "bg-green-500/20 border-green-500 text-green-500" },
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

        <div className="flex justify-center gap-2 py-4">
          {faces.map((face) => (
            <button
              key={face.rating}
              onClick={() => setRating(face.rating)}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl transition-all ${
                rating === face.rating
                  ? face.color + " scale-110 shadow-md"
                  : "border-border bg-card hover:scale-105"
              }`}
            >
              {face.emoji}
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
