"use strict";
/* Ponto a Ponto — interface da página. Depende de braille.js e tests.js. */

/* =========================================================
   DESENHO DAS CELAS
   ========================================================= */
function cellNode(dots, kind, label){
  const wrap = document.createElement("div"); wrap.className = "cell";
  const g = document.createElement("div");
  g.className = "grid" + (kind==="space" ? " space" : "") + (kind==="unknown" ? " unknown" : "");
  for (const n of ["1","4","2","5","3","6"]){
    const p = document.createElement("span"); p.className = "pt" + (dots.includes(n) ? " on" : ""); g.appendChild(p);
  }
  wrap.appendChild(g);
  if (label !== null){ const l = document.createElement("span"); l.className = "lab"; l.textContent = label; wrap.appendChild(l); }
  return wrap;
}
function drawCells(host, cells, showLabels){
  host.textContent = "";
  for (const c of cells){
    const label = !showLabels ? null : (c.kind==="space" ? "esp" : (c.kind==="unknown" ? "?" : (c.dots || "")));
    host.appendChild(cellNode(c.dots || "", c.kind, label));
  }
}


/* abas: cada lista de abas controla os próprios painéis */
document.querySelectorAll('[role="tablist"]').forEach(list => {
  const tabs = [...list.querySelectorAll(':scope > [role="tab"]')];
  const select = t => tabs.forEach(o => {
    const on = o === t;
    o.setAttribute("aria-selected", on ? "true" : "false");
    o.tabIndex = on ? 0 : -1;
    document.getElementById(o.getAttribute("aria-controls")).hidden = !on;
  });
  tabs.forEach((t, k) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", e => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const n = tabs[(k + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      select(n); n.focus();
    });
  });
});

/* =========================================================
   INTERFACE
   ========================================================= */
const $ = id => document.getElementById(id);
function runEncode(){
  const {cells, unknown} = encode($("src").value);
  drawCells($("encCells"), cells, $("showNums").checked);
  $("encUni").textContent = encodeStr($("src").value);
  $("encWarn").textContent = unknown.length
    ? "Sem sinal na tabela para: " + unknown.join(" ") + "."
    : (cells.length ? "" : "Digite um texto para traduzir.");
}
$("encBtn").addEventListener("click", runEncode);
$("src").addEventListener("input", runEncode);
$("showNums").addEventListener("change", runEncode);
$("copyBtn").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("encUni").textContent); $("copyBtn").textContent = "Copiado"; }
  catch { $("copyBtn").textContent = "Não deu para copiar"; }
  setTimeout(()=>{ $("copyBtn").textContent = "Copiar Braille"; }, 1600);
});
$("printBtn").addEventListener("click", () => window.print());

let current = new Set();
document.querySelectorAll(".dot").forEach(b => b.addEventListener("click", () => {
  const d = b.dataset.d;
  if (current.has(d)){ current.delete(d); b.setAttribute("aria-pressed","false"); }
  else { current.add(d); b.setAttribute("aria-pressed","true"); }
}));
function resetKeypad(){ current = new Set(); document.querySelectorAll(".dot").forEach(b => b.setAttribute("aria-pressed","false")); }
function appendToInput(s){ $("bsrc").value += s; runDecode(); }
$("addCell").addEventListener("click", () => { if (!current.size) return; appendToInput(dotsToChar([...current].sort().join(""))); resetKeypad(); });
$("addSpace").addEventListener("click", () => appendToInput(" "));
$("delCell").addEventListener("click", () => { $("bsrc").value = [...$("bsrc").value].slice(0,-1).join(""); runDecode(); });
$("clearCells").addEventListener("click", () => { $("bsrc").value = ""; resetKeypad(); runDecode(); });
function runDecode(){
  const raw = $("bsrc").value;
  const cells = [...raw].filter(c => c === " " || (c >= "\u2800" && c <= "\u283F"))
    .map(c => c === " " ? {dots:"", kind:"space"} : {dots:charToDots(c), kind:"char"});
  drawCells($("decCells"), cells, true);
  const {text, unknown} = decode(raw);
  $("decOut").textContent = text;
  $("decWarn").textContent = unknown.length ? "Cela sem correspondência na tabela: " + unknown.join(" ") : "";
}
$("decBtn").addEventListener("click", runDecode);
$("bsrc").addEventListener("input", runDecode);

(function buildTable(){
  const tb = $("refTable").querySelector("tbody");
  for (const [chr, seq, note, page] of TABLE_ROWS){
    const tr = document.createElement("tr");
    const vals = [chr, seq.map(dotsToChar).join(""), seq.join(" "), note, "p. " + page];
    vals.forEach((v, k) => { const td = document.createElement("td"); if (k === 1) td.className = "b"; td.textContent = v; tr.appendChild(td); });
    tb.appendChild(tr);
  }
})();

$("runTests").addEventListener("click", () => {
  const tb = $("testTable").querySelector("tbody"); tb.textContent = "";
  const rows = runAllTests(); let pass = 0;
  for (const [name, input, exp, got, ok] of rows){
    if (ok) pass++;
    const tr = document.createElement("tr");
    for (const v of [name, input, exp, got]){ const td = document.createElement("td"); td.textContent = v; tr.appendChild(td); }
    const td = document.createElement("td"); td.textContent = ok ? "passou" : "falhou"; td.className = ok ? "pass" : "fail"; tr.appendChild(td);
    tb.appendChild(tr);
  }
  $("score").textContent = pass + " de " + rows.length + " testes passaram (" + Math.round(100*pass/rows.length) + "%)";
});

const btn = $("themeBtn");
function setTheme(mode){
  document.documentElement.setAttribute("data-theme", mode);
  btn.textContent = mode === "dark" ? "Modo claro" : "Modo escuro";
  try { localStorage.setItem("pp-theme", mode); } catch {}
}
try {
  const saved = localStorage.getItem("pp-theme");
  if (saved) setTheme(saved); else setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
} catch { setTheme("light"); }
btn.addEventListener("click", () => setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"));

$("src").value = "Louis Braille (1809-1852) nasceu na França.";
runEncode(); runDecode();
