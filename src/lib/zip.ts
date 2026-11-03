// Escritor mínimo de ZIP (um único arquivo, deflate), sem dependências.
// O IncluirAnexo do Omie exige o arquivo compactado em ZIP e convertido em base64.
import { deflateRawSync } from "node:zlib";

const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(dados: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < dados.length; i++) c = TABELA_CRC[(c ^ dados[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dataDos(d: Date) {
  const hora = (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1);
  const data = (Math.max(d.getUTCFullYear() - 1980, 0) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate();
  return { hora, data };
}

/** Compacta `dados` num ZIP com um único arquivo chamado `nome` (UTF-8). */
export function zipUmArquivo(nome: string, dados: Uint8Array, quando = new Date()): Buffer {
  const nomeBuf = Buffer.from(nome, "utf8");
  const comprimido = deflateRawSync(dados);
  const crc = crc32(dados);
  const { hora, data } = dataDos(quando);
  const FLAG_UTF8 = 0x0800;

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4); // versão necessária
  local.writeUInt16LE(FLAG_UTF8, 6);
  local.writeUInt16LE(8, 8); // deflate
  local.writeUInt16LE(hora, 10);
  local.writeUInt16LE(data, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(comprimido.length, 18);
  local.writeUInt32LE(dados.length, 22);
  local.writeUInt16LE(nomeBuf.length, 26);
  local.writeUInt16LE(0, 28);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4); // versão que criou
  central.writeUInt16LE(20, 6); // versão necessária
  central.writeUInt16LE(FLAG_UTF8, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(hora, 12);
  central.writeUInt16LE(data, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(comprimido.length, 20);
  central.writeUInt32LE(dados.length, 24);
  central.writeUInt16LE(nomeBuf.length, 28);
  // extra (30), comentário (32), disco (34), atributos internos (36) e externos (38): zero
  central.writeUInt32LE(0, 42); // posição do cabeçalho local

  const inicioCentral = local.length + nomeBuf.length + comprimido.length;
  const tamCentral = central.length + nomeBuf.length;

  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(1, 8); // entradas neste disco
  fim.writeUInt16LE(1, 10); // entradas no total
  fim.writeUInt32LE(tamCentral, 12);
  fim.writeUInt32LE(inicioCentral, 16);

  return Buffer.concat([local, nomeBuf, comprimido, central, nomeBuf, fim]);
}
