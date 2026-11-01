import type { NextConfig } from "next";
const config: NextConfig = {
  // Chromium sem tela para a calculadora de molas (DOCO): não empacotar, usar direto do node_modules.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};
export default config;
