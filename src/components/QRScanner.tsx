import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { logger } from "@/lib/logger";

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const mountedRef = useRef(false);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner || !scanner.isScanning) return;
    await scanner.stop().catch(() => {});
  }, []);

  const getCameraErrorMessage = useCallback(
    (rawError: unknown) => {
      const message = rawError instanceof Error ? rawError.message : String(rawError ?? "");

      if (/NotAllowedError|Permission denied|permission denied/i.test(message)) {
        return `${t.cameraError as string} Permita o acesso nas definições do browser.`;
      }

      if (/NotFoundError|Requested device not found|device not found|no camera/i.test(message)) {
        return `${t.cameraError as string} Não foi encontrada câmara neste dispositivo.`;
      }

      if (/MediaDevices API unavailable|getUserMedia/i.test(message)) {
        return `${t.cameraError as string} Este browser não suporta acesso à câmara.`;
      }

      return t.cameraError as string;
    },
    [t.cameraError],
  );

  const handleDecoded = useCallback(
    (decodedText: string) => {
      if (!mountedRef.current) return;
      const match = decodedText.match(/(\d{6})/);
      if (!match) return;

      mountedRef.current = false;
      onScanRef.current(match[1]);
      void stopScanner();
    },
    [stopScanner],
  );

  const startScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner || !mountedRef.current) return;

    setError("");
    setStarting(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("MediaDevices API unavailable");
      }

      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      permissionStream.getTracks().forEach((track) => track.stop());

      const scanConfig = {
        fps: 12,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1,
      };

      const cameras = await Html5Qrcode.getCameras();
      const backCamera = cameras.find((camera) =>
        /back|rear|environment|traseira|tras|posterior/i.test(camera.label),
      );

      const selectedSource: string | { facingMode: string } =
        backCamera?.id ?? cameras[0]?.id ?? { facingMode: "environment" };

      await scanner.start(selectedSource, scanConfig, handleDecoded, () => {});
    } catch (startError) {
      logger.error("[QRScanner] camera start error", startError);
      if (mountedRef.current) {
        setError(getCameraErrorMessage(startError));
      }
    } finally {
      if (mountedRef.current) {
        setStarting(false);
      }
    }
  }, [getCameraErrorMessage, handleDecoded]);

  useEffect(() => {
    mountedRef.current = true;
    scannerRef.current = new Html5Qrcode("qr-reader");
    void startScanner();

    return () => {
      mountedRef.current = false;
      void stopScanner();
      scannerRef.current = null;
    };
  }, [startScanner, stopScanner]);

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
          <button
            onClick={() => void startScanner()}
            className="w-full mt-3 py-2 text-xs uppercase tracking-widest border border-border text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            {t.readQR as string}
          </button>
        )}

        {error && (
          <p className="text-xs text-destructive mt-3 text-center">{error}</p>
        )}

        {!error && starting && (
          <p className="text-xs text-muted-foreground mt-3 text-center">{t.loading as string}</p>
        )}

        <p className="text-xs text-muted-foreground mt-3 text-center">
          {t.pointCamera as string}
        </p>
      </div>
    </div>
  );
};

export default QRScanner;
