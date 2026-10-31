import { test } from "node:test";
import assert from "node:assert/strict";
import { calcular, comIcms, precoLiquido } from "./icms.ts";

test("preço líquido = custo × peso ÷ CMV (confere com preco_referencia da tabela)", () => {
  assert.equal(precoLiquido(1.8, 4, 0.35), 20.57);
  assert.equal(precoLiquido(105.11, 0.6, 0.35), 180.19);
});

test("dentro do PR: alíquota interna cheia, inclusive importado", () => {
  assert.equal(calcular({ uf: "PR", contribuinte: true, destinacao: "uso" }, false).aliqFixDoor, 19.5);
  assert.equal(calcular({ uf: "PR", contribuinte: true, destinacao: "uso" }, true).aliqFixDoor, 19.5);
});

test("fora do PR, contribuinte: interestadual 12% (Sul/Sudeste exceto ES) ou 7%", () => {
  assert.equal(calcular({ uf: "SP", contribuinte: true, destinacao: "ativo" }, false).aliqFixDoor, 12);
  assert.equal(calcular({ uf: "BA", contribuinte: true, destinacao: "uso" }, false).aliqFixDoor, 7);
  assert.equal(calcular({ uf: "ES", contribuinte: true, destinacao: "uso" }, false).aliqFixDoor, 7);
});

test("importado fora do PR: 4%", () => {
  const c = calcular({ uf: "SP", contribuinte: true, destinacao: "uso" }, true);
  assert.equal(c.aliqFixDoor, 4);
  assert.equal(c.difalPor, "cliente");
});

test("não contribuinte: FixDoor embute a alíquota interna do destino (DIFAL por conta dela)", () => {
  const c = calcular({ uf: "RJ", contribuinte: false, destinacao: "uso" }, false);
  assert.equal(c.aliqFixDoor, 22);
  assert.equal(c.aliqNF, 12);
  assert.equal(c.difalPor, "fixdoor");
});

test("revenda com IE: só interestadual, sem DIFAL", () => {
  const c = calcular({ uf: "MG", contribuinte: true, destinacao: "revenda" }, false);
  assert.deepEqual(c, { aliqFixDoor: 12, aliqNF: 12, difal: 0, difalPor: null });
});

test("ICMS por dentro", () => {
  assert.equal(comIcms(100, 12), 113.64);
  assert.equal(comIcms(20.57, 19.5), 25.55);
});
