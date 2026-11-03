// Molas de torção para portas seccionais.
// - Cálculo da mola: calculadora oficial da DOCO (https://doco-international.com/en/support/spring_calculator),
//   que roda no navegador (app GWT em /verenwebapp/VerenWebApp.html). Abrimos a página num Chromium sem tela,
//   preenchemos os campos e lemos as opções que ela devolve.
// - Peso da mola (aço, 7,85 g/cm³): massa = densidade × (π·d²/4) × π·(DI + d) × (comprimento / d).
//   Confere com a DOCO (ex.: DI 95,25 · fio 8,5 · 1439 mm = 24,58 kg).
// - Preço FixDoor: R$ 180 por kg = valor SEM ICMS; o ICMS é aplicado depois (aplicar_icms).

export const PRECO_KG_MOLA = 180;
const DENSIDADE_ACO = 7.85e-6; // kg/mm³
const URL_DOCO = "https://doco-international.com/verenwebapp/VerenWebApp.html";

const arred = (n: number, c = 2) => Math.round((n + Number.EPSILON) * 10 ** c) / 10 ** c;

export function pesoMola(diametroInterno: number, fio: number, comprimento: number): number {
  if (!(diametroInterno > 0 && fio > 0 && comprimento > 0)) throw new Error("Informe diâmetro interno, fio e comprimento da mola (mm).");
  const espiras = comprimento / fio;
  const comprimentoFio = Math.PI * (diametroInterno + fio) * espiras;
  return arred(DENSIDADE_ACO * (Math.PI * fio * fio / 4) * comprimentoFio);
}

export interface MolaInformada { diametro_interno_mm: number; fio_mm: number; comprimento_mm: number; quantidade: number }

/** Preço de molas já especificadas (sem usar a calculadora). */
export function precificarMolas(molas: MolaInformada[], precoKg = PRECO_KG_MOLA) {
  const itens = molas.map((m) => {
    const peso = pesoMola(m.diametro_interno_mm, m.fio_mm, m.comprimento_mm);
    const unit = arred(peso * precoKg);
    return { ...m, peso_kg: peso, preco_kg: precoKg, valor_unitario_sem_icms: unit, valor_total_sem_icms: arred(unit * m.quantidade) };
  });
  return { itens, total_sem_icms: arred(itens.reduce((s, i) => s + i.valor_total_sem_icms, 0)), peso_total_kg: arred(itens.reduce((s, i) => s + i.peso_kg * i.quantidade, 0)) };
}

export interface EntradaDoco {
  largura_mm: number; altura_mm: number; peso_porta_kg: number;
  /** BS. Opcional: sem ele, vale o BS padrão que a própria calculadora calcula a partir do DW (e da altura). */
  peso_painel_inferior_kg?: number;
  tipo_porta?: string; numero_molas?: number; ciclos?: number; acabamento?: string; calculo?: string; tambor?: string;
  lift_mm?: number; pitch?: number;
  /** Texto do campo "Reference" no PDF (ex.: "A.L. BRAZ - pedido 5712"). */
  referencia?: string;
}

// ---- PDF de cálculo da DOCO (botão "Print" da calculadora) ----
// O botão baixa https://doco-international.com/verenwebapp/springpdf.pdf?<parâmetros>: uma URL pública (GET, sem login)
// que só renderiza os parâmetros, sem recalcular. Por isso montamos a URL com o resultado que a própria calculadora devolveu.
const URL_PDF_DOCO = "https://doco-international.com/verenwebapp/springpdf.pdf";
const VERSAO_DOCO = "Spring Calculator v2.1.3";
/** kindOfDoor = posição do tipo de porta no menu da calculadora (conferido em 03/11/2026). */
const CODIGO_TIPO_PORTA: Record<string, number> = {
  "Standard": 0, "Standard + Pitch": 1, "High-Lift": 2, "High-Lift + Pitch": 3, "Vertical-Lift": 4, "Low-HeadRoom": 5,
};

export interface MolaCalculada {
  diametro_interno_mm: number; fio_mm: number; comprimento_mm: number; kcm_por_volta: number; voltas: number; ciclos_mil: number; peso_kg: number;
}

/**
 * URL do PDF de cálculo (o mesmo do botão Print) para uma opção de mola. Devolve null quando não dá para montar com segurança
 * (modo Booster, ou tipo de porta desconhecido). `tamborCompleto` é o texto do tambor escolhido (ex.: "110090 0.5SW M-216-3350")
 * e `bs` é o peso do painel inferior que a calculadora usou (informado ou o padrão dela).
 */
export function urlPdfCalculo(e: EntradaDoco, molas: MolaCalculada[], tamborCompleto: string, bs: number): string | null {
  const tipo = e.tipo_porta ?? "Standard";
  const codigo = CODIGO_TIPO_PORTA[tipo];
  if (codigo === undefined || !molas.length || (e.calculo ?? "Optimal") === "Booster") return null;
  const n = e.numero_molas ?? 2;
  const um = (x: number) => String(Math.round(x * 10) / 10);
  const comPitch = tipo.includes("Pitch");
  const comLift = tipo.includes("High");
  const q: [string, string | number][] = [
    ["kindOfDoor", codigo], ["OH", e.altura_mm], ["OW", e.largura_mm],
    ["Lift", tipo === "Vertical-Lift" ? e.altura_mm : comLift ? e.lift_mm ?? 0 : 0],
    ["Pitch", tipo === "Vertical-Lift" ? 90 : comPitch ? e.pitch ?? 0 : 0],
    ["DW", e.peso_porta_kg], ["BS", bs],
    ["Calculation", e.calculo ?? "Optimal"], ["Cabledrums", tamborCompleto], ["Cycles", e.ciclos ?? 25000],
    ["Spring_Choice", e.acabamento ?? "Normal"], ["Number", n], ["NumberLeft", Math.ceil(n / 2)], ["NumberRight", Math.floor(n / 2)],
    ["Reference", e.referencia ?? ""], ["Version", VERSAO_DOCO],
  ];
  for (let i = 1; i <= n; i++) {
    const m = molas[i - 1] ?? molas[0]; // a calculadora lista uma linha por opção quando as molas são iguais
    q.push([`Dl${i}`, um(m.diametro_interno_mm)], [`ID${i}`, m.fio_mm], [`Length${i}`, m.comprimento_mm], [`Kcm_U${i}`, m.kcm_por_volta],
      [`Sp_U${i}`, m.voltas], [`Weight${i}`, m.peso_kg], [`LE${i}`, m.ciclos_mil]);
  }
  return `${URL_PDF_DOCO}?${q.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")}`;
}

async function abrirNavegador() {
  const puppeteer = (await import("puppeteer-core")).default;
  if (process.env.CHROMIUM_PATH) return puppeteer.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ["--no-sandbox"] });
  // Vercel: versão "min" baixa o pacote do Chromium na 1ª execução (fica em /tmp enquanto a função estiver quente)
  const chromium = (await import("@sparticuz/chromium-min")).default;
  const pacote = process.env.CHROMIUM_PACK_URL ?? "https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.x64.tar";
  return puppeteer.launch({ executablePath: await chromium.executablePath(pacote), args: chromium.args, headless: true });
}

/** Roda a calculadora da DOCO e devolve as opções de mola (cada opção = conjunto de molas). */
export async function calcularMolaDoco(e: EntradaDoco, precoKg = PRECO_KG_MOLA) {
  const campos: Record<string, string | number | undefined> = {
    "Door type": e.tipo_porta ?? "Standard",
    W: e.largura_mm, H: e.altura_mm, DW: e.peso_porta_kg, BS: e.peso_painel_inferior_kg,
    Lift: e.lift_mm, Pitch: e.pitch,
    Calculation: e.calculo ?? "Optimal", Cabledrums: e.tambor, Cycles: e.ciclos ?? 25000,
    "Spring Choice": e.acabamento ?? "Normal", "Nr of Springs": e.numero_molas ?? 2,
  };
  const browser = await abrirNavegador();
  try {
    const p = await browser.newPage();
    await p.goto(URL_DOCO, { waitUntil: "networkidle2", timeout: 40_000 });
    await p.waitForFunction(() => /Kcm\/U/.test(document.body.innerText), { timeout: 25_000 });
    // O BS é marcado mesmo quando não foi informado: assim lemos o valor que a calculadora calculou sozinha.
    const rotulos = [...Object.entries(campos).filter(([, v]) => v !== undefined && v !== "").map(([k]) => k), ...(campos.BS === undefined ? ["BS"] : [])];
    // marca cada campo pelo rótulo visível mais próximo na mesma linha
    const naoAchados: string[] = await p.evaluate((rots: string[]) => {
      const falta: string[] = [];
      const folhas = [...document.querySelectorAll("td,div,span,label")].filter((x) => x.children.length === 0);
      const cs = [...document.querySelectorAll("input,select")].filter((c) => c.getBoundingClientRect().width > 0);
      for (const rot of rots) {
        const el = folhas.find((x) => x.textContent!.trim() === rot && x.getBoundingClientRect().width > 0);
        if (!el) { falta.push(rot); continue; }
        const r = el.getBoundingClientRect(); const cy = r.top + r.height / 2;
        let melhor: Element | null = null, dist = 1e9;
        for (const c of cs) {
          const q = c.getBoundingClientRect();
          if (Math.abs(q.top + q.height / 2 - cy) > 12) continue;
          const dx = q.left >= r.right ? q.left - r.right : r.left - q.right;
          if (dx >= -5 && dx < dist) { dist = dx; melhor = c; }
        }
        if (melhor) melhor.setAttribute("data-k", rot); else falta.push(rot);
      }
      return falta;
    }, rotulos);
    const avisos: string[] = naoAchados.map((r) => `Campo "${r}" não encontrado na calculadora.`);
    for (const rot of rotulos) {
      if (naoAchados.includes(rot) || campos[rot] === undefined) continue; // BS sem valor: deixa o padrão da calculadora
      const sel = `[data-k="${rot}"]`;
      const valor = String(campos[rot]);
      const tag = await p.$eval(sel, (x) => x.tagName);
      if (tag === "SELECT") {
        const ops = await p.$$eval(`${sel} option`, (os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: o.textContent!.trim() })));
        const op = ops.find((o) => o.t === valor) ?? ops.find((o) => o.t.startsWith(valor));
        if (!op) { avisos.push(`"${rot}" = ${valor} não existe. Opções: ${ops.map((o) => o.t).join(" | ")}`); continue; }
        await p.select(sel, op.v);
      } else {
        // GWT escuta o evento "change" do campo: define o valor e dispara os eventos como um usuário faria
        await p.$eval(sel, (x, v) => {
          const el = x as HTMLInputElement;
          el.focus();
          el.value = v as string;
          for (const ev of ["input", "keyup", "change", "blur"]) el.dispatchEvent(new Event(ev, { bubbles: true }));
        }, valor);
      }
      if (tag === "SELECT") await p.$eval(sel, (x) => x.dispatchEvent(new Event("change", { bubbles: true })));
      await new Promise((r) => setTimeout(r, 200));
    }
    await new Promise((r) => setTimeout(r, 800));
    const aplicados: Record<string, string> = await p.evaluate(() =>
      Object.fromEntries([...document.querySelectorAll("[data-k]")].map((x) => {
        const el = x as HTMLInputElement | HTMLSelectElement;
        const txt = el.tagName === "SELECT" ? (el as HTMLSelectElement).selectedOptions[0]?.text ?? "" : el.value;
        return [x.getAttribute("data-k")!, txt.trim()];
      })));
    for (const rot of rotulos) {
      if (naoAchados.includes(rot) || campos[rot] === undefined) continue;
      const esperado = String(campos[rot]);
      if (!(aplicados[rot] ?? "").startsWith(esperado)) avisos.push(`"${rot}" ficou "${aplicados[rot]}" (esperado ${esperado}).`);
    }
    // BS usado: o informado ou, se omitido, o padrão que a calculadora calculou a partir do DW
    const bsInformado = campos.BS !== undefined;
    const bsUsado = bsInformado ? Number(campos.BS) : Number(String(aplicados["BS"] ?? "").replace(",", "."));
    if (!(bsUsado > 0)) avisos.push(`Não consegui ler o BS que a calculadora calculou (veio "${aplicados["BS"] ?? ""}"). Informe peso_painel_inferior_kg.`);
    const linhas: string[][] = await p.evaluate(() => {
      const t = [...document.querySelectorAll("table")].find((x) => /^Dl\s/.test((x as HTMLElement).innerText.trim()));
      return t ? [...t.querySelectorAll("tr")].slice(1).map((tr) => [...(tr as HTMLTableRowElement).cells].map((c) => (c as HTMLElement).innerText.trim())) : [];
    });
    // agrupa em opções: linhas de mola até a linha "-"
    const opcoes: any[] = [];
    let atual: any[] = [];
    for (const l of linhas) {
      if (l.every((c) => c === "-" || c === "")) { if (atual.length) opcoes.push(atual); atual = []; continue; }
      const [di, fio, comp, kcm, voltas, peso, ciclos] = l.map(Number);
      const pesoKg = Number.isFinite(peso) ? peso : pesoMola(di, fio, comp);
      atual.push({ diametro_interno_mm: di, fio_mm: fio, comprimento_mm: comp, kcm_por_volta: kcm, voltas, peso_kg: pesoKg, ciclos_mil: ciclos,
        valor_sem_icms: arred(pesoKg * precoKg) });
    }
    if (atual.length) opcoes.push(atual);
    // tambor realmente escolhido pela calculadora (o padrão, se não foi informado), para o PDF de cálculo
    const tamborCompleto: string = await p.evaluate(() => {
      const s = [...document.querySelectorAll("select")].find((x) => [...x.options].some((o) => /^\d{6} \d\.\dSW/.test(o.text)));
      return s?.selectedOptions[0]?.text ?? "";
    });
    return {
      entrada: { ...campos, BS: bsUsado > 0 ? bsUsado : campos.BS },
      bs_origem: bsInformado ? "informado" : "padrão da calculadora (calculado a partir do DW)",
      avisos,
      preco_kg_sem_icms: precoKg,
      opcoes: opcoes.map((molas, i) => ({
        opcao: i + 1,
        recomendada: i === 0,
        molas,
        peso_total_kg: arred(molas.reduce((s: number, m: any) => s + m.peso_kg, 0)),
        total_sem_icms: arred(molas.reduce((s: number, m: any) => s + m.valor_sem_icms, 0)),
        // PDF de cálculo (botão Print da DOCO) desta opção: anexe ao card do RD (rd_anexar_arquivo) e ao pedido (omie_anexar_arquivo)
        pdf_calculo_url: tamborCompleto && bsUsado > 0 ? urlPdfCalculo(e, molas, tamborCompleto, bsUsado) : null,
      })),
      fonte: "Calculadora DOCO (doco-international.com/en/support/spring_calculator)",
    };
  } finally {
    await browser.close();
  }
}
