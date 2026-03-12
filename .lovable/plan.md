

## Plan: Move client code display to QR code box

### Changes

1. **`src/pages/Index.tsx`** — Remove the client code display from the header (lines 151-154).

2. **`src/components/ClientQRCode.tsx`** — Add the client code text below the QR code image, inside the existing section.

