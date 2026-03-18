import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ClientQRCodeProps {
  clientCode: string;
}

const ClientQRCode = ({ clientCode }: ClientQRCodeProps) => {
  const { t } = useLanguage();
  if (!clientCode) return null;

  return (
    <div className="p-6">
      <div className="flex flex-col items-center">
        <div className="bg-white p-4 rounded-2xl shadow-card">
          <QRCodeSVG value={clientCode} size={180} level="H" bgColor="#ffffff" fgColor="#3d2e1f" />
        </div>
        <p className="text-foreground tracking-[0.35em] font-semibold mt-4 text-xl w-[180px] text-center">
          {clientCode}
        </p>
      </div>
    </div>
  );
};

export default ClientQRCode;
