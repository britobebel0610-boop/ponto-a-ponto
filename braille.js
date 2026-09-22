/* Ponto a Ponto — regras de tradução do Braille em português.
   Este arquivo não depende da página: funciona no navegador e no Node. */
"use strict";

/* =========================================================
   TABELA DE SINAIS
   Fonte: Grafia Braille para a Língua Portuguesa (MEC/IBC).
   Números de página = páginas do documento.
   ========================================================= */
const L = {
  a:"1", b:"12", c:"14", d:"145", e:"15", f:"124", g:"1245", h:"125", i:"24", j:"245",
  k:"13", l:"123", m:"134", n:"1345", o:"135", p:"1234", q:"12345", r:"1235", s:"234",
  t:"2345", u:"136", v:"1236", w:"2456", x:"1346", y:"13456", z:"1356",
  "ç":"12346",
  "á":"12356", "é":"123456", "í":"34", "ó":"346", "ú":"23456",
  "à":"1246",
  "â":"16", "ê":"126", "ô":"1456",
  "ã":"345", "õ":"246",
  "ü":"1256"
};
const DIG = {"1":"1","2":"12","3":"14","4":"145","5":"15","6":"124","7":"1245","8":"125","9":"24","0":"245"};
const LOW = {"1":"2","2":"23","3":"25","4":"256","5":"26","6":"235","7":"2356","8":"236","9":"35","0":"356"};
const CAP = "46", NUM = "3456", LET = "5";
const PUNCT = {
  ",":["2"], ";":["23"], ":":["25"], ".":["3"], "'":["3"], "?":["26"], "!":["235"],
  "-":["36"], "–":["36","36"], "—":["36","36"], "…":["3","3","3"],
  "*":["35"], "/":["6","2"], "$":["56"], "%":["456","356"], "&":["12346"],
  '"':["236"], "“":["236"], "”":["236"], "‘":["6","236"]
};

const TABLE_ROWS = [
  ...Object.keys(L).filter(k => k !== "ü").map(k => [k, [L[k]], k === "ç" ? "mesma cela do &" : (k === "ê" ? "mesma cela do ( simples" : (k === "ã" ? "mesma cela do ) simples" : "")), 23]),
  ["ü", ["1256"], "não existe mais no português; está no Apêndice B (outros idiomas)", 75],
  [",", ["2"], "também é a vírgula decimal", 24],
  [";", ["23"], "", 24], [":", ["25"], "", 24],
  [".", ["3"], "ponto final e ponto abreviativo", 24],
  ["' ’", ["3"], "apóstrofo (mesma cela do ponto)", 24],
  ["?", ["26"], "", 24], ["!", ["235"], "", 24],
  ["…", ["3","3","3"], "reticências", 24],
  ["-", ["36"], "hífen", 24], ["–", ["36","36"], "travessão", 24],
  ["*", ["35"], "asterisco", 24],
  ["( )", ["126","3"], "abre, forma composta (palavras); fecha: 6 345", 53],
  ["( ) com números", ["126"], "forma simples: abre 126, fecha 345", 50],
  ["[ ]", ["12356","3"], "abre, forma composta; fecha: 6 23456", 53],
  ["[ ] com números", ["12356"], "forma simples: abre 12356, fecha 23456", 50],
  ["“ ” \"", ["236"], "abre e fecha aspas (mesma cela)", 24],
  ["‘ ’", ["6","236"], "aspas simples", 24],
  ["&", ["12346"], "e comercial", 24],
  ["/", ["6","2"], "barra", 24],
  ["$", ["56"], "cifrão", 25], ["%", ["456","356"], "por cento", 25],
  ["sinal de maiúscula", [CAP], "antes da letra", 26],
  ["caixa alta", [CAP,CAP], "antes da primeira letra da palavra toda em maiúsculas", 27],
  ["sinal de número", [NUM], "só antes do primeiro algarismo", 29],
  ["separador de classes", ["3"], "só em números com mais de 4 algarismos na parte inteira", 30],
  ["ordinais", [NUM,"2"], "algarismos da 5ª série + o/a (ex.: 1º)", 30],
  ["sinal de minúscula latina", [LET], "entre número e letra minúscula de a até j", 31]
];

const dotsToChar = d => String.fromCharCode(0x2800 + [...d].reduce((m,n)=>m|(1<<(+n-1)),0));
const charToDots = ch => { const v = ch.charCodeAt(0) - 0x2800; let o=""; for (let i=0;i<6;i++) if (v&(1<<i)) o+=(i+1); return o; };

/* =========================================================
   TEXTO -> BRAILLE
   ========================================================= */
const isDigit = c => c !== undefined && c >= "0" && c <= "9";
const isLetter = c => c !== undefined && /\p{L}/u.test(c);
const isUpper = c => isLetter(c) && c === c.toUpperCase() && c !== c.toLowerCase();

function encode(text){
  const ch = [...text];
  const cells = [], unknown = new Set();
  const push = (dots, kind, from) => cells.push({dots, kind, from});

  const capsStart = new Set(), capsCovered = new Set();
  let start = null;
  for (let k = 0; k <= ch.length; k++){
    if (k === ch.length || /\s/.test(ch[k])){
      if (start !== null){
        const idx = []; for (let m = start; m < k; m++) if (isLetter(ch[m])) idx.push(m);
        const shape = ch.slice(start,k).join("").replace(/[^\p{L}.]/gu, "");
        const dotted = /^(\p{Lu}\.)+$/u.test(shape);
        if (idx.length > 1 && idx.every(m => isUpper(ch[m])) && !dotted){
          capsStart.add(idx[0]); idx.forEach(m => capsCovered.add(m));
        }
        start = null;
      }
    } else if (start === null) start = k;
  }

  const simple = new Set(), stack = [];
  ch.forEach((c,k) => {
    if (c === "(" || c === "[") stack.push(k);
    else if (c === ")" || c === "]"){
      const o = stack.pop();
      if (o === undefined){ if (isDigit(ch[k-1])) simple.add(k); return; }
      const inside = ch.slice(o+1,k).join("");
      if (/^\d/.test(inside) || /^[IVXLCDM]+$/.test(inside)){ simple.add(o); simple.add(k); }
    }
  });

  const sepAt = k => (ch[k] === " " || ch[k] === ".") && isDigit(ch[k+1]) && isDigit(ch[k+2]) && isDigit(ch[k+3]) && !isDigit(ch[k+4]);
  const intLength = k => { let n = 0; while (k < ch.length){ if (isDigit(ch[k])){ n++; k++; } else if (sepAt(k)) k++; else break; } return n; };

  let num = false, intLen = 0;
  for (let i = 0; i < ch.length; i++){
    const c = ch[i], prev = ch[i-1], next = ch[i+1];

    if (isDigit(c)){
      let j = i; while (isDigit(ch[j])) j++;
      if (!num && (ch[j] === "º" || ch[j] === "ª")){
        push(NUM, "sign", "número");
        for (let k = i; k < j; k++) push(LOW[ch[k]], "char", ch[k]);
        push(L[ch[j] === "º" ? "o" : "a"], "char", ch[j]);
        i = j; num = false; continue;
      }
      if (!num){ push(NUM, "sign", "número"); num = true; intLen = intLength(i); }
      push(DIG[c], "char", c);
      continue;
    }
    if (num && c === "," && isDigit(next)){ push("2", "char", ","); continue; }
    if (num && sepAt(i)){ if (intLen > 4) push("3", "char", c); continue; }

    if (isLetter(c)){
      const low = c.toLowerCase(), d = L[low];
      if (!d){ unknown.add(c); push("", "unknown", c); num = false; continue; }
      if (num && !isUpper(c) && "abcdefghij".includes(low)) push(LET, "sign", "letra");
      num = false;
      if (capsStart.has(i)){ push(CAP, "sign", "caixa alta"); push(CAP, "sign", "caixa alta"); }
      else if (isUpper(c) && !capsCovered.has(i)) push(CAP, "sign", "maiúscula");
      push(d, "char", c);
      continue;
    }

    num = false;
    if (/\s/.test(c)){ push("", "space", " "); continue; }
    if (c === "("){ push("126", "char", c); if (!simple.has(i)) push("3", "char", c); continue; }
    if (c === ")"){ if (!simple.has(i)) push("6", "char", c); push("345", "char", c); continue; }
    if (c === "["){ push("12356", "char", c); if (!simple.has(i)) push("3", "char", c); continue; }
    if (c === "]"){ if (!simple.has(i)) push("6", "char", c); push("23456", "char", c); continue; }
    if (c === "’"){ (isLetter(prev) && isLetter(next) ? ["3"] : ["6","236"]).forEach(d => push(d, "char", c)); continue; }
    if (PUNCT[c]){ PUNCT[c].forEach(d => push(d, "char", c)); continue; }
    unknown.add(c); push("", "unknown", c);
  }
  return {cells, unknown:[...unknown]};
}
const encodeStr = t => encode(t).cells.map(c => c.kind==="space" ? " " : (c.kind==="unknown" ? "\u2717" : dotsToChar(c.dots))).join("");

/* =========================================================
   BRAILLE -> TEXTO
   ========================================================= */
const REV = {}; Object.entries(L).forEach(([k,v]) => REV[v] = k);
const DIGREV = {}; Object.entries(DIG).forEach(([k,v]) => DIGREV[v] = k);
const LOWREV = {}; Object.entries(LOW).forEach(([k,v]) => LOWREV[v] = k);
const PREV = {"2":",", "23":";", "25":":", "26":"?", "235":"!", "236":'"', "35":"*", "56":"$"};

function decode(braille){
  const cells = [...braille].filter(c => c === " " || (c >= "\u2800" && c <= "\u283F")).map(c => c === " " ? " " : charToDots(c));
  let out = "", num = false, ord = false, cap = false, capWord = false, capSeries = false, simpleOpen = 0;
  const unknown = [];
  const isEnd = x => x === undefined || x === " " || PREV[x] !== undefined || x === "3";
  for (let i = 0; i < cells.length; i++){
    const d = cells[i], n1 = cells[i+1], n2 = cells[i+2], p1 = cells[i-1];
    if (d === " "){ out += " "; num = false; ord = false; capWord = false; continue; }
    if (d === "25" && n1 === CAP && n2 === CAP){ capSeries = true; i += 2; continue; }
    if (d === CAP){ num = false; if (n1 === CAP){ capWord = true; capSeries = false; i++; } else cap = true; continue; }
    if (d === NUM){ num = true; ord = LOWREV[n1] !== undefined; continue; }
    if (ord){
      if (LOWREV[d] !== undefined){ out += LOWREV[d]; continue; }
      ord = false; num = false;
      if (d === "135"){ out += "º"; continue; }
      if (d === "1"){ out += "ª"; continue; }
    }
    if (num){
      if (DIGREV[d] !== undefined){ out += DIGREV[d]; continue; }
      if (d === LET){ num = false; continue; }
      if (d === "2" && DIGREV[n1] !== undefined){ out += ","; continue; }
      if (d === "3" && DIGREV[n1] !== undefined){ out += "."; continue; }
      num = false;
      if (d === "345"){ out += ")"; if (simpleOpen) simpleOpen--; continue; }
      if (d === "23456"){ out += "]"; continue; }
    }
    if (d === "126"){
      if (n1 === "3"){ out += "("; i++; continue; }
      if (n1 === NUM || n1 === CAP){ out += "("; simpleOpen++; continue; }
    }
    if (d === "12356"){
      if (n1 === "3"){ out += "["; i++; continue; }
      if (n1 === NUM || n1 === CAP){ out += "["; continue; }
    }
    if (d === "345" && simpleOpen > 0 && isEnd(n1)){ out += ")"; simpleOpen--; continue; }
    if (d === "6"){
      if (n1 === "345"){ out += ")"; i++; continue; }
      if (n1 === "23456"){ out += "]"; i++; continue; }
      if (n1 === "2"){ out += "/"; i++; continue; }
      if (n1 === "236"){ out += "'"; i++; continue; }
    }
    if (d === "3"){
      if (n1 === "3" && n2 === "3"){ out += "..."; i += 2; continue; }
      out += "."; continue;
    }
    if (d === "36"){ if (n1 === "36"){ out += "–"; i++; } else out += "-"; continue; }
    if (d === "456" && n1 === "356"){ out += "%"; i++; continue; }
    if (d === "12346" && (p1 === undefined || p1 === " ") && (n1 === undefined || n1 === " ")){ out += "&"; continue; }
    if (PREV[d]){ out += PREV[d]; continue; }
    const letter = REV[d];
    if (!letter){ unknown.push(dotsToChar(d)); out += "\u2717"; continue; }
    out += (cap || capWord || capSeries) ? letter.toUpperCase() : letter;
    cap = false;
  }
  return {text:out, unknown};
}


if (typeof module !== "undefined" && module.exports){
  module.exports = { L, DIG, LOW, CAP, NUM, LET, PUNCT, TABLE_ROWS, dotsToChar, charToDots, encode, encodeStr, decode };
}
