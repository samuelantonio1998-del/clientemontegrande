import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ClientQRCodeProps {
  clientCode: string;
}

const ClientQRCode = ({ clientCode }: ClientQRCodeProps) => {
  const { t } = useLanguage();
  if (!clientCode) return null;

  return (
    <section className="mt-4 border border-border p-6 bg-card flex flex-col items-center mx-[100px]">
      <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">
        {t.yourQRCode as string}
      </p>
      <div className="bg-white p-4 rounded-sm">
        <QRCodeSVG
          value={clientCode}
          size={180}
          level="H"
          bgColor="#ffffff"
          fgColor="#3d2e1f" />
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        {t.code as string}: <span className="text-foreground tracking-widest font-semibold">{clientCode}</span>
      </p>
    </section>
  );
};

export default ClientQRCode;