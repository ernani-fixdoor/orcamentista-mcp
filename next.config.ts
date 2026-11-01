import type { NextConfig } from "next";
const chromiumBin = ["./node_modules/@sparticuz/chromium/bin/**"];
const config: NextConfig = {
  // Chromium sem tela para a calculadora de molas (DOCO): não empacotar, usar direto do node_modules,
  // e incluir os binários (pasta bin) nas funções que abrem o navegador.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/[chave]/[transport]": chromiumBin,
    "/[chave]/mola": chromiumBin,
  },
};
export default config;
