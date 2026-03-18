import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ReferralButtonProps {
  referralCode: string;
}

const ReferralButton = ({ referralCode }: ReferralButtonProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!referralCode) return null;

  const referralLink = `${window.location.origin}/login?ref=${referralCode}`;
  const displayLink = `clientequintamontegrande.com/login?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="mx-4 mt-4 flex justify-center">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full px-6 py-4 bg-card shadow-card flex items-center gap-3 hover:shadow-elevated transition-all duration-200"
        >
          <Users className="w-5 h-5 text-primary shrink-0" />
          <span className="text-sm uppercase tracking-widest text-foreground font-medium">
            {t.inviteFriends as string}
          </span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base uppercase tracking-widest">
              {t.referralTitle as string}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t.referralDescription as string}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex flex-col gap-3">
            <div className="bg-muted rounded-xl px-4 py-3 text-xs text-foreground font-mono break-all">
              {displayLink}
            </div>
            <button
              onClick={handleCopy}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-button"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {t.linkCopied as string}
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  {t.copyLink as string}
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReferralButton;
