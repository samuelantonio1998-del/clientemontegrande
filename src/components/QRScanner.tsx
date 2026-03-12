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
  const onScanRef = useRef(onScan);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let mounted = true;
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const scanConfig = {
      fps: 12,
      qrbox: { width: 240, height: 240 },
      aspectRatio: 1,
    };

    const handleDecoded = (decodedText: string) => {
      if (!mounted) return;
      const match = decodedText.match(/(\d{6})/);
      if (!match) return;

      mounted = false;
      onScanRef.current(match[1]);
      if (scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: { ideal: "environment" } },
          scanConfig,
          handleDecoded,
          () => {}
        );
        return;
      } catch {
        try {
          const cameras = await Html5Qrcode.getCameras();
          const backCamera = cameras.find((camera) =>
            /back|rear|environment|traseira|tras|posterior/i.test(camera.label)
          );
          const selectedCamera = backCamera ?? cameras[0];

          if (selectedCamera) {
            await scanner.start(
              selectedCamera.id,
              scanConfig,
              handleDecoded,
              () => {}
            );
            return;
          }
        } catch {
          // handled below
        }
      }

      if (mounted) {
        setError(t.cameraError as string);
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [t.cameraError]);

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
