import { test } from "node:test";
import assert from "node:assert/strict";
import { crc32 as crcZlib, inflateRawSync } from "node:zlib";
import { crc32, zipUmArquivo } from "./zip.ts";
import { extensao, nomeSeguro, urlPublica } from "./omie.ts";

test("crc32 bate com o do zlib", () => {
  for (const s of ["", "a", "Cálculo da mola 5712", "x".repeat(100_000)]) {
    assert.equal(crc32(Buffer.from(s)), crcZlib(Buffer.from(s)));
  }
});

test("zip tem estrutura válida e o conteúdo volta igual", () => {
  const dados = Buffer.concat([Buffer.from("%PDF-1.3\n"), Buffer.alloc(5000, 7), Buffer.from("fim")]);
  const nome = "Cálculo da mola - Pedido 5712.pdf";
  const zip = zipUmArquivo(nome, dados, new Date(Date.UTC(2026, 10, 3, 18, 0, 0)));

  const fim = zip.length - 22;
  assert.equal(zip.readUInt32LE(fim), 0x06054b50, "EOCD");
  assert.equal(zip.readUInt16LE(fim + 10), 1, "uma entrada");
  const inicioCentral = zip.readUInt32LE(fim + 16);
  assert.equal(zip.readUInt32LE(inicioCentral), 0x02014b50, "diretório central");
  assert.equal(zip.readUInt32LE(0), 0x04034b50, "cabeçalho local");

  const tamNome = zip.readUInt16LE(26);
  assert.equal(zip.subarray(30, 30 + tamNome).toString("utf8"), nome);
  const crc = zip.readUInt32LE(14);
  const tamComp = zip.readUInt32LE(18);
  const tamOrig = zip.readUInt32LE(22);
  assert.equal(tamOrig, dados.length);
  const volta = inflateRawSync(zip.subarray(30 + tamNome, 30 + tamNome + tamComp));
  assert.deepEqual(volta, dados);
  assert.equal(crcZlib(volta), crc);
  // o diretório central repete os mesmos números
  assert.equal(zip.readUInt32LE(inicioCentral + 16), crc);
  assert.equal(zip.readUInt32LE(inicioCentral + 20), tamComp);
  assert.equal(zip.readUInt32LE(inicioCentral + 24), tamOrig);
});

test("nomeSeguro limita a 100 caracteres e mantém a extensão", () => {
  assert.equal(nomeSeguro('a/b:c*d?.pdf'), "a b c d .pdf");
  const longo = nomeSeguro("n".repeat(150) + ".pdf");
  assert.equal(longo.length, 100);
  assert.ok(longo.endsWith(".pdf"));
  assert.equal(nomeSeguro("   "), "arquivo.pdf");
});

test("extensao", () => {
  assert.equal(extensao("Proposta 5712.PDF"), "pdf");
  assert.equal(extensao("semextensao", "application/pdf"), "pdf");
  assert.equal(extensao("x", "image/jpeg"), "jpg");
});

test("urlPublica bloqueia o que não é https público", () => {
  assert.doesNotThrow(() => urlPublica("https://doco-international.com/verenwebapp/springpdf.pdf?x=1"));
  for (const u of ["http://doco-international.com/a.pdf", "https://localhost/a", "https://127.0.0.1/a", "https://10.0.0.5/a",
    "https://192.168.1.1/a", "https://172.20.0.1/a", "https://169.254.169.254/latest", "https://[::1]/a", "https://x.internal/a"]) {
    assert.throws(() => urlPublica(u), /https públicas/, u);
  }
});
