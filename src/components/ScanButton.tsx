import { QrCode } from "lucide-react";

interface ScanButtonProps {
  onScan: () => void;
}

const ScanButton = ({ onScan }: ScanButtonProps) => {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
      <button
        onClick={onScan}
        className="w-16 h-16 bg-signal-orange text-primary-foreground flex items-center justify-center border-2 border-foreground hover:scale-105 active:scale-95 transition-transform duration-0"
        aria-label="Escanear QR Code"
      >
        <QrCode className="w-7 h-7" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default ScanButton;
