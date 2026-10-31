import sys, json, re, openpyxl
wb = openpyxl.load_workbook(sys.argv[1], read_only=True)
ws = wb.worksheets[0]
pais = {}  # nivel(digitos) -> descricao
ultimo_ncm = None
linhas, estranhas = [], []
def limpa(t): return re.sub(r"\s+", " ", str(t or "")).strip()
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i < 8: continue
    ncm, ex, desc, aliq = (row + (None,) * 4)[:4]
    cod = re.sub(r"\D", "", str(ncm or ""))
    desc = limpa(desc)
    exs = re.sub(r"\D", "", str(ex or ""))
    if cod and len(cod) < 8:
        pais[len(cod)] = desc.lstrip("- ").strip()
        for k in list(pais):
            if k > len(cod): del pais[k]
        continue
    if not cod and exs and ultimo_ncm:   # linha de Ex sob o NCM anterior
        cod = ultimo_ncm
    if len(cod) != 8:
        if any(row): estranhas.append((i, row))
        continue
    if not exs: ultimo_ncm = cod
    a = aliq
    nt = isinstance(a, str) and a.strip().upper() == "NT"
    if nt: val = None
    elif a in (None, ""): val = None
    else:
        try: val = float(str(a).replace(",", "."))
        except ValueError:
            estranhas.append((i, row)); val = None
    cadeia = [pais[k] for k in sorted(pais) if k <= 7]
    folha = desc.lstrip("- ").strip()
    completa = " > ".join([c for c in cadeia[-2:] if c] + [folha])[:500]
    linhas.append({"ncm": cod, "ex": exs.zfill(2) if exs else "", "descricao": completa, "aliquota": val, "nt": nt})
# dedup (ncm, ex): mantém o último
d = {}
for l in linhas: d[(l["ncm"], l["ex"])] = l
out = list(d.values())
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False)
print("linhas", len(linhas), "unicas", len(out), "nt", sum(l["nt"] for l in out), "sem_aliq", sum(1 for l in out if l["aliquota"] is None and not l["nt"]), "com_ex", sum(1 for l in out if l["ex"]))
print("estranhas", len(estranhas)); [print(e) for e in estranhas[:8]]
for n in ["85389010", "85437099", "84313900", "73089010", "84313100", "76109000"]:
    print([l for l in out if l["ncm"] == n])
