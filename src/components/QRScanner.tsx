import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    let mounted = true;
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
          (decodedText) => {
            if (!mounted) return;
            // Extract 6 digits from the scanned text (handles whitespace, URLs, etc.)
            const match = decodedText.match(/(\d{6})/);
            if (match) {
              const code = match[1];
              mounted = false;
              scanner.stop().then(() => onScan(code)).catch(() => onScan(code));
            }
          },
          () => {}
        );
      } catch (err) {
        if (mounted) {
          console.error("QR Scanner error:", err);
          setError(t.cameraError as string);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            {t.scannerQR as string}
          </p>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          id="qr-reader"
          className="w-full border border-border overflow-hidden"
        />

        {error && (
          <p className="text-xs text-destructive mt-3 text-center">{error}</p>
        )}

        <p className="text-xs text-muted-foreground mt-3 text-center">
          {t.pointCamera as string}
        </p>
      </div>
    </div>
  );
};

export default QRScanner;
