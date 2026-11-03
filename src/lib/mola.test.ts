import { test } from "node:test";
import assert from "node:assert/strict";
import { urlPdfCalculo } from "./mola.ts";

// URL gerada de verdade pelo botão Print da calculadora da DOCO (03/11/2026), caso A.L. BRAZ, pedido 5712
const URL_REAL = "https://doco-international.com/verenwebapp/springpdf.pdf?kindOfDoor=4&OH=2810&OW=2450&Lift=2810&Pitch=90&DW=76&BS=15&Calculation=Optimal&Cabledrums=110090%200.5SW%20M-216-3350&Cycles=12500&Spring_Choice=Normal&Number=1&NumberLeft=1&NumberRight=0&Reference=A.L.%20BRAZ%20-%20pedido%205712&Version=Spring%20Calculator%20v2.1.3&Dl1=95.3&ID1=8&Length1=951&Kcm_U1=72.43&Sp_U1=10.33&Weight1=15.22&LE1=21.25";

const entrada = { largura_mm: 2450, altura_mm: 2810, peso_porta_kg: 76, peso_painel_inferior_kg: 15, tipo_porta: "Vertical-Lift", numero_molas: 1, ciclos: 12500, acabamento: "Normal", calculo: "Optimal", referencia: "A.L. BRAZ - pedido 5712" };
const mola = { diametro_interno_mm: 95.25, fio_mm: 8, comprimento_mm: 951, kcm_por_volta: 72.43, voltas: 10.33, ciclos_mil: 21.25, peso_kg: 15.22 };

test("PDF de cálculo: URL igual à do botão Print (VL, 1 mola)", () => {
  assert.equal(urlPdfCalculo(entrada, [mola], "110090 0.5SW M-216-3350"), URL_REAL);
});

test("PDF de cálculo: 2 molas repetem os campos com sufixo 2 e dividem esquerda/direita", () => {
  const u = urlPdfCalculo({ ...entrada, tipo_porta: "Standard", numero_molas: 2, calculo: "Equal" }, [mola], "110140 0.5SW M-102-3760")!;
  assert.match(u, /kindOfDoor=0&.*Lift=0&Pitch=0&/);
  assert.match(u, /Number=2&NumberLeft=1&NumberRight=1&/);
  assert.match(u, /Dl2=95\.3&ID2=8&Length2=951&Kcm_U2=72\.43&Sp_U2=10\.33&Weight2=15\.22&LE2=21\.25$/);
});

test("PDF de cálculo: High-Lift + Pitch leva Lift e Pitch informados; Booster não gera URL", () => {
  const u = urlPdfCalculo({ ...entrada, tipo_porta: "High-Lift + Pitch", lift_mm: 1200, pitch: 10 }, [mola], "110060 0.5SW M-134-1375")!;
  assert.match(u, /kindOfDoor=3&OH=2810&OW=2450&Lift=1200&Pitch=10&/);
  assert.equal(urlPdfCalculo({ ...entrada, calculo: "Booster" }, [mola], "x"), null);
  assert.equal(urlPdfCalculo({ ...entrada, tipo_porta: "Inexistente" }, [mola], "x"), null);
});
