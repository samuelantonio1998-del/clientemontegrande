interface StampOverlayProps {
  pointsGained: number;
}

const StampOverlay = ({ pointsGained }: StampOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center">
      <div className="animate-stamp-down flex flex-col items-center">
        <div className="border-4 border-signal-orange px-8 py-6 bg-background rotate-[-6deg]">
          <span className="font-display text-6xl text-signal-orange leading-none">
            +{pointsGained}
          </span>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.3em] mt-1 text-center">
            pontos
          </p>
        </div>
      </div>
    </div>
  );
};

export default StampOverlay;
