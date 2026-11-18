// Acesso ao conector por chave de pessoa.
// - MCP_CHAVE (variável da Vercel) continua valendo como chave de administração (também libera /saude, /mola e /rd-oauth).
// - Chaves por pessoa ficam em orcamentista.chaves_acesso (só o hash SHA-256). Revogar = ativo=false, sem deploy.
//   Validação em public.orc_acesso_validar; resultado em cache por 60 s nesta instância.
import { createHash, timingSafeEqual } from "node:crypto";
import { rpc } from "./supabase.ts";

const TTL_MS = 60_000;
const cache = new Map<string, { ate: number; nome: string | null }>();

const igual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Nome da pessoa dona da chave (ou "admin" para a MCP_CHAVE); null se a chave não vale. */
export async function autenticar(chave: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(chave)) return null;
  const mestre = process.env.MCP_CHAVE;
  if (mestre && mestre.length >= 16 && igual(chave, mestre)) return "admin";
  const hash = createHash("sha256").update(chave).digest("hex");
  const c = cache.get(hash);
  if (c && c.ate > Date.now()) return c.nome;
  try {
    const r = await rpc<{ nome: string } | null>("orc_acesso_validar", { p_hash: hash });
    const nome = r?.nome ?? null;
    cache.set(hash, { ate: Date.now() + TTL_MS, nome });
    return nome;
  } catch {
    return null; // sem banco, só a chave de administração funciona
  }
}
