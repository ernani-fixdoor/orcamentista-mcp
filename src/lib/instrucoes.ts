// Instruções da skill servidas pelo conector (pasta /instrucoes do repositório).
// A skill instalada em cada conta é só um carregador fixo: o texto do processo vale para todos
// assim que o conector é publicado, sem reinstalar skill e sem reconectar o conector.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const RAIZ = path.join(process.cwd(), "instrucoes");

export async function listarTopicos(): Promise<string[]> {
  const nomes = await readdir(path.join(RAIZ, "referencias"));
  return nomes.filter((n) => n.endsWith(".md")).map((n) => n.replace(/\.md$/, "")).sort();
}

/** Sem tópico (ou "processo"): o processo completo. "indice": lista os tópicos. Outro: a referência. */
export async function lerInstrucao(topico?: string) {
  const t = (topico ?? "processo").trim().toLowerCase();
  if (t === "indice") return { topicos: ["processo", ...(await listarTopicos())] };
  if (!/^[a-z0-9-]+$/.test(t)) throw new Error("Tópico inválido. Use skill_instrucoes com topico='indice' para ver os disponíveis.");
  const arquivo = t === "processo" ? path.join(RAIZ, "processo.md") : path.join(RAIZ, "referencias", `${t}.md`);
  try {
    return { topico: t, texto: await readFile(arquivo, "utf8") };
  } catch {
    throw new Error(`Tópico '${t}' não existe. Disponíveis: processo, ${(await listarTopicos()).join(", ")}.`);
  }
}
