import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ClientQRCodeProps {
  clientCode: string;
  size?: number;
  showCode?: boolean;
}

const ClientQRCode = ({ clientCode, size = 180, showCode = true }: ClientQRCodeProps) => {
  const { t } = useLanguage();
  if (!clientCode) return null;

  return (
    <div className={showCode ? "p-6" : "shrink-0"}>
      <div className="flex flex-col items-center">
        <div className={showCode ? "bg-white p-4 rounded-2xl shadow-card" : "bg-card p-2 rounded-[10px]"}>
          <QRCodeSVG value={clientCode} size={size} level="H" bgColor="#ffffff" fgColor="#3d2e1f" />
        </div>
        {showCode && <p className="text-foreground tracking-[0.35em] font-semibold mt-4 text-xl w-[180px] text-center">
          {clientCode}
        </p>}
      </div>
    </div>
  );
};

export default ClientQRCode;
