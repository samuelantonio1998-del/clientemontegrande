/**
 * Logger que só escreve na consola em desenvolvimento.
 * Em produção (build), as chamadas tornam-se no-ops — evita poluir a
 * consola do browser do utilizador final e expor estrutura interna.
 *
 * Uso:
 *   import { logger } from "@/lib/logger";
 *   logger.error("register-meal error:", data);
 *   logger.warn("Rate limit indisponível");
 *   logger.log("debug info");
 */
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // Erros mantêm-se em dev. Em produção, podes futuramente ligar isto
    // a um serviço de monitorização (ex.: Sentry) em vez de silenciar.
    if (isDev) console.error(...args);
  },
};
