import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ClientQRCodeProps {
  clientCode: string;
}

const ClientQRCode = ({ clientCode }: ClientQRCodeProps) => {
  const { t } = useLanguage();
  if (!clientCode) return null;

  return (
    <section className="mt-4 border border-border p-6 bg-card mx-4 sm:mx-[100px]">
      <h2 className="font-display text-lg text-foreground mb-4 uppercase">{t.yourQRCode as string}</h2>
      <div className="flex flex-col items-center">
      <div className="bg-white p-4 rounded-sm">
        <QRCodeSVG value={clientCode} size={180} level="H" bgColor="#ffffff" fgColor="#3d2e1f" />
      </div>
      <p className="text-foreground tracking-[0.35em] font-semibold mt-4 text-xl w-[180px] text-center">
        {clientCode}
      </p>
    </section>
  );
};

export default ClientQRCode;
