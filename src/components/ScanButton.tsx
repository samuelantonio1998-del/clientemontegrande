import { QrCode } from "lucide-react";

interface ScanButtonProps {
  onScan: () => void;
}

const ScanButton = ({ onScan }: ScanButtonProps) => {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
      <button
        onClick={onScan}
        className="w-16 h-16 bg-primary text-primary-foreground flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg"
        aria-label="Escanear QR Code"
      >
        <QrCode className="w-7 h-7" strokeWidth={2} />
      </button>
    </div>
  );
};

export default ScanButton;
