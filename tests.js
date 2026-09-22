"use strict";
/* Ponto a Ponto — testes de validação.
   No navegador: usados pela aba Testes.
   No terminal: node tests.js */
if (typeof window === "undefined") Object.assign(globalThis, require("./braille.js"));

/* =========================================================
   TESTES — exemplos copiados do documento oficial.
   A coluna de Braille está exatamente como no PDF (fonte SimBraille,
   que usa o código Braille ASCII); o programa converte para celas.
   ========================================================= */
const BASCII = {
  a:"1",b:"12",c:"14",d:"145",e:"15",f:"124",g:"1245",h:"125",i:"24",j:"245",k:"13",l:"123",m:"134",
  n:"1345",o:"135",p:"1234",q:"12345",r:"1235",s:"234",t:"2345",u:"136",v:"1236",w:"2456",x:"1346",
  y:"13456",z:"1356","!":"2346",'"':"5","#":"3456","$":"1246","%":"146","&":"12346","'":"3",
  "(":"12356",")":"23456","*":"16","+":"346",",":"6","-":"36",".":"46","/":"34","0":"356","1":"2",
  "2":"23","3":"25","4":"256","5":"26","6":"235","7":"2356","8":"236","9":"35",":":"156",";":"56",
  "<":"126","=":"123456",">":"345","?":"1456","@":"4","[":"246","\\":"1256","]":"12456","^":"45","_":"456"
};
const fromAscii = s => [...s.toLowerCase()].map(c => c === " " ? " " : dotsToChar(BASCII[c])).join("");

const CASES = [
  ["maiúscula inicial", 27, "Amazonas", ".amazonas"],
  ["maiúscula e ê", 27, "Tietê", ".tiet<"],
  ["maiúscula e â", 27, "Atlântico", ".atl*ntico"],
  ["palavra em caixa alta", 27, "BRASIL", "..brasil"],
  ["frase em caixa alta", 27, "INDEPENDÊNCIA OU MORTE!", "..independ<ncia ..ou ..morte6"],
  ["travessão", 27, "– INDEPENDÊNCIA", "-- ..independ<ncia"],
  ["sigla", 28, "ONG", "..ong"],
  ["sigla com pontos", 28, "S.O.S.", ".s'.o'.s'"],
  ["número", 29, "20", "#bj"],
  ["número", 29, "181", "#aha"],
  ["número com zero", 29, "809", "#hji"],
  ["vírgula decimal", 29, "0,75", "#j1ge"],
  ["vírgula decimal", 29, "4,5", "#d1e"],
  ["4 algarismos com espaço", 29, "7 639,125", "#gfci1abe"],
  ["4 algarismos", 30, "4517", "#deag"],
  ["separador de classes", 30, "10 000", "#aj'jjj"],
  ["separador de classes", 30, "4.000.000", "#d'jjj'jjj"],
  ["separador e decimal", 30, "22.950,07", "#bb'iej1jg"],
  ["ordinal", 30, "1º", "#1o"],
  ["ordinal", 30, "387ª", "#387a"],
  ["ordinal plural", 30, "10ºs", "#10os"],
  ["data com hífen", 31, "17-09-54", "#ag-#ji-#ed"],
  ["números com ponto", 31, "5.2.1", "#e'#b'#a"],
  ["data com barra", 31, "10/09/2001", "#aj,1#ji,1#bjja"],
  ["número e maiúscula", 31, "28-A", "#bh-.a"],
  ["número e maiúscula", 31, "4D", "#d.d"],
  ["número e letra de a a j", 31, "17a", '#ag"a'],
  ["número e letras de a a j", 31, "6ab", '#f"ab'],
  ["número e letra depois de j", 31, "5x", "#ex"],
  ["letra e número", 31, "A4", ".a#d"],
  ["romano e número", 31, "VI.2", "..vi'#b"],
  ["letras entre números", 31, "0xx61", "#jxx#fa"],
  ["cifrão", 33, "R$45,00", ".r;#de1jj"],
  ["cifrão, 4 algarismos", 33, "R$1 000,00", ".r;#ajjj1jj"],
  ["dólar", 33, "US$5,20", "..us;#e1bj"],
  ["vírgula e ponto", 47, "Brasil, Portugal.", ".brasil1 .portugal'"],
  ["interrogação", 47, "Por quê?", ".por qu<5"],
  ["aspas", 47, "\"Querer é poder.\"", "8.querer = poder'8"],
  ["e comercial", 47, "Alves & Cia.", ".alves & .cia'"],
  ["apóstrofo", 48, "gota d'água", "gota d'(gua"],
  ["reticências", 49, "Salve!...", ".salve6'''"],
  ["reticências entre parênteses", 49, "(...)", "<'''',>"],
  ["parênteses com números", 50, "Louis Braille (1809-1852) nasceu na França.", ".louis .braille <#ahji-#aheb> nasceu na .fran&a'"],
  ["parênteses com romano", 50, "(VI)", "<..vi>"],
  ["colchetes com números", 50, "[2020 é séc. 21]", "(#bjbj = s=c' #ba)"],
  ["enumeração", 51, "exercício 1)", "exerc/cio #a>"],
  ["medida entre parênteses", 52, "(1 h 5 min)", "<#a h #e min>"],
  ["porcentagem", 52, "(100%)", "<#ajj_0>"],
  ["parênteses compostos", 53, "Castro Alves (poeta) viveu no século XIX.", ".castro .alves <'poeta,> viveu no s=culo ..xix'"],
  ["parênteses na palavra", 53, "Estimado(a) amigo(a)", ".estimado<'a,> amigo<'a,>"]
];
const TRIPS = ["Amazonas", "Tietê", "BRASIL", "INDEPENDÊNCIA OU MORTE!", "S.O.S.", "0,75", "4.000.000",
  "22.950,07", "1º", "387ª", "17-09-54", "5.2.1", "10/09/2001", "28-A", "4D", "17a", "6ab", "5x", "A4",
  "VI.2", "0xx61", "R$45,00", "US$5,20", "Brasil, Portugal.", "Por quê?", "\"Querer é poder.\"",
  "Alves & Cia.", "Louis Braille (1809-1852) nasceu na França.", "(VI)", "exercício 1)", "(1 h 5 min)",
  "(100%)", "Castro Alves (poeta) viveu no século XIX.", "Estimado(a) amigo(a)", "(...)", "Salve!...",
  "coração", "mãe", "Tenho 17 anos"];

function runAllTests(){
  const rows = [];
  for (const [name, page, input, ascii] of CASES){
    const exp = fromAscii(ascii), got = encodeStr(input);
    rows.push([name + " (p. " + page + ")", input, exp, got, exp === got]);
  }
  for (const t of TRIPS){
    const got = decode(encodeStr(t)).text;
    rows.push(["ida e volta", t, t, got, got === t]);
  }
  return rows;
}

if (typeof module !== "undefined" && typeof require !== "undefined" && require.main === module){
  const rows = runAllTests();
  const fails = rows.filter(r => !r[4]);
  for (const [name, input, exp, got] of fails) console.log("FALHOU  " + name + "  |  " + input + "  |  esperado " + exp + "  |  obtido " + got);
  console.log((rows.length - fails.length) + " de " + rows.length + " testes passaram");
  process.exitCode = fails.length ? 1 : 0;
}
