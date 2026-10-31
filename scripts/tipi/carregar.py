import json, sys, urllib.request
dados = json.load(open(sys.argv[1]))
chave = open(sys.argv[2]).read().strip()
url = "https://emoptjbvfcnaeeeeuxbq.supabase.co/rest/v1/rpc/orc_tipi_carregar"
key = "sb_publishable_cPf_hDbAqUDVadSrOlOiBA_PeHCoLVl"
vig = "TIPI 2022 (Decreto 11.158/2022), atualizada até o ADE RFB nº 1/2026 — planilha da Receita baixada em 31/10/2026"
total = 0
for i in range(0, len(dados), 1000):
    corpo = json.dumps({"p_chave": chave, "p_linhas": dados[i:i+1000], "p_vigencia": vig}).encode()
    req = urllib.request.Request(url, data=corpo, method="POST", headers={"apikey": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        n = json.loads(r.read()); total += n
        print(f"lote {i//1000+1}: {n}")
print("total", total)
