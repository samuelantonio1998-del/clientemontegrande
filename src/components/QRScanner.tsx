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
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const code = decodedText.trim();
          if (/^\d{6}$/.test(code)) {
            scanner.stop().then(() => onScan(code)).catch(() => onScan(code));
          }
        },
        () => {}
      )
      .catch(() => {
        setError(t.cameraError as string);
      });

    return () => {
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
