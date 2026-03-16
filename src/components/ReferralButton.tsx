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

  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
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
      <div className="mx-4 sm:mx-[100px] mt-4 flex justify-center">
        <button
          onClick={() => setOpen(true)}
          className="border border-border px-6 py-4 bg-card flex items-center gap-3 hover:bg-muted transition-colors"
        >
          <Users className="w-5 h-5 text-primary shrink-0" />
          <span className="text-sm uppercase tracking-widest text-foreground">
            {t.inviteFriends as string}
          </span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base uppercase tracking-widest">
              {t.referralTitle as string}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t.referralDescription as string}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex flex-col gap-3">
            <div className="bg-muted border border-border px-3 py-2 text-xs text-foreground font-mono break-all rounded-sm">
              {referralLink}
            </div>
            <button
              onClick={handleCopy}
              className="w-full py-2.5 bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
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
