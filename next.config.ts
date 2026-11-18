import type { NextConfig } from "next";
const config: NextConfig = {
  // Chromium sem tela para a calculadora de molas (DOCO): não empacotar, usar direto do node_modules.
  // Instruções da skill lidas em tempo de execução pelo conector (src/lib/instrucoes.ts).
  outputFileTracingIncludes: { "/**": ["./instrucoes/**/*"] },
  serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"],
};
export default config;
