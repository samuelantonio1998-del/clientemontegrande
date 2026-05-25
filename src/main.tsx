import { createRoot } from "react-dom/client";

// Fontes self-hosted (substituem o @import do Google Fonts no index.css).
// Só os pesos realmente usados no projeto:
//   Inter            → 400, 500, 600, 700
//   Playfair Display → 400, 500, 600, 700
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";

import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
