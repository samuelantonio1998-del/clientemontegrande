import { useLanguage } from "@/contexts/LanguageContext";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  pinInput?: string;
  onPinChange?: (value: string) => void;
}

const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, pinInput, onPinChange }: ConfirmDialogProps) => {
  const { t } = useLanguage();

  if (!open) return null;

  const hasPinField = pinInput !== undefined && onPinChange !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="bg-card border border-border p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        {hasPinField && (
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pinInput}
            onChange={(e) => onPinChange(e.target.value.replace(/\D/g, ""))}
            placeholder="PIN"
            className="w-full mb-4 bg-background border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-foreground tracking-widest text-center transition-colors"
            autoFocus
          />
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-border text-xs uppercase tracking-widest text-foreground hover:bg-muted transition-colors"
          >
            {t.cancel as string}
          </button>
          <button
            onClick={onConfirm}
            disabled={hasPinField && pinInput.length === 0}
            className="flex-1 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {t.confirm as string}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
