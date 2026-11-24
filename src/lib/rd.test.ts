import test from "node:test";
import assert from "node:assert/strict";
import { corpoNovoNegocio, avisosCamposObrigatorios } from "./rd.ts";

test("corpoNovoNegocio: só inclui o que foi informado", () => {
  assert.deepEqual(corpoNovoNegocio({ nome: "  IC TRANSPORTES  ", etapa_id: "e1" }), { deal: { name: "IC TRANSPORTES", deal_stage_id: "e1" } });
});

test("corpoNovoNegocio: empresa, contatos, responsável e campos", () => {
  const c = corpoNovoNegocio({ nome: "Cliente X", etapa_id: "e1", responsavel_id: "u1", empresa_id: "o1", contato_ids: ["c1", "c2"], campos: [{ custom_field_id: "f1", valor: "SIM" }] });
  assert.deepEqual(c, { deal: { name: "Cliente X", deal_stage_id: "e1", user_id: "u1", organization_id: "o1", contacts_ids: ["c1", "c2"], deal_custom_fields: [{ custom_field_id: "f1", value: "SIM" }] } });
});

test("corpoNovoNegocio: recusa nome curto e etapa vazia", () => {
  assert.throws(() => corpoNovoNegocio({ nome: "ab", etapa_id: "e1" }), /nome/);
  assert.throws(() => corpoNovoNegocio({ nome: "Cliente", etapa_id: "" }), /etapa_id/);
});

test("avisosCamposObrigatorios: avisa quando ITENS DA SOLICITAÇÃO falta ou está vazio", () => {
  assert.equal(avisosCamposObrigatorios({ nome: "Cliente", etapa_id: "e1" }).length, 1);
  assert.equal(avisosCamposObrigatorios({ nome: "Cliente", etapa_id: "e1", campos: [{ custom_field_id: "68f67acf567c110015b75265", valor: "  " }] }).length, 1);
  assert.match(avisosCamposObrigatorios({ nome: "Cliente", etapa_id: "e1" })[0], /ITENS DA SOLICITAÇÃO/);
});

test("avisosCamposObrigatorios: sem aviso quando preenchido", () => {
  assert.deepEqual(avisosCamposObrigatorios({ nome: "Cliente", etapa_id: "e1", campos: [{ custom_field_id: "68f67acf567c110015b75265", valor: "MANUTENÇÃO" }] }), []);
});
