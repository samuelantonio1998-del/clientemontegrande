import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gift } from "lucide-react";

interface DiscountCelebrationProps {
  show: boolean;
  onClose: () => void;
}

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "#d4a574",
  "#c9956b",
  "#b8845a",
  "#e8c9a0",
  "#f0dcc0",
];

const ConfettiPiece = ({ index }: { index: number }) => {
  const left = Math.random() * 100;
  const delay = Math.random() * 0.8;
  const duration = 2 + Math.random() * 1.5;
  const size = 6 + Math.random() * 8;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const rotation = Math.random() * 360;
  const drift = (Math.random() - 0.5) * 80;

  return (
    <motion.div
      className="absolute top-0 rounded-full"
      style={{
        left: `${left}%`,
        width: size,
        height: size * 0.6,
        backgroundColor: color,
      }}
      initial={{ y: -20, opacity: 1, rotate: rotation }}
      animate={{
        y: "100vh",
        x: drift,
        opacity: [1, 1, 0],
        rotate: rotation + 360 * (Math.random() > 0.5 ? 1 : -1),
      }}
      transition={{
        duration,
        delay,
        ease: "easeIn",
      }}
    />
  );
};

const DiscountCelebration = ({ show, onClose }: DiscountCelebrationProps) => {
  const { t } = useLanguage();
  const [confetti, setConfetti] = useState<number[]>([]);

  useEffect(() => {
    if (show) {
      setConfetti(Array.from({ length: 50 }, (_, i) => i));
    }
  }, [show]);

  const handleClose = useCallback(() => {
    onClose();
    setConfetti([]);
  }, [onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={handleClose} />

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confetti.map((i) => (
              <ConfettiPiece key={i} index={i} />
            ))}
          </div>

          <motion.div
            className="relative z-10 mx-6 max-w-sm w-full"
            initial={{ scale: 0.5, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
          >
            <div className="bg-card rounded-3xl shadow-elevated p-8 text-center">
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                <Gift className="w-8 h-8 text-primary" />
              </motion.div>

              <motion.h2
                className="font-display text-3xl text-foreground mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                🎉
              </motion.h2>

              <motion.p
                className="font-display text-2xl text-primary mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {t.discountAvailable as string}
              </motion.p>

              <motion.p
                className="text-sm text-muted-foreground mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {t.discountCelebrationMsg as string}
              </motion.p>

              <motion.button
                onClick={handleClose}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-widest hover:bg-primary/90 transition-all duration-200 shadow-button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {t.celebrationDismiss as string}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DiscountCelebration;
