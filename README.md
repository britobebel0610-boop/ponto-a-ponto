# Ponto a Ponto — tradutor de Braille em português

Tradutor entre texto e Braille para quem **não sabe ler Braille**. A ideia é diminuir a barreira de comunicação entre pessoas que usam Braille e pessoas que não conhecem o sistema: quem não lê Braille consegue entender o que foi escrito em Braille e escrever de volta.

Projeto desenvolvido para a STEM Fair 2026.

## O que o programa faz

**Tradutor**
- **Texto → Braille:** transforma texto em celas Braille, mostrando os pontos numerados de cada cela. Pode imprimir as celas como molde para fazer relevo à mão.
- **Braille → Texto:** a pessoa monta cada cela tocando nos seis pontos e o programa lê o texto.

**Método e Validação**
- **Tabela:** todos os sinais usados pelo programa, com a página do documento oficial de onde cada um foi tirado.
- **Testes:** 89 testes automáticos. São 50 exemplos copiados do documento oficial e 39 testes de ida e volta (texto → Braille → texto).

## Regras implementadas

Seguindo a *Grafia Braille para a Língua Portuguesa* (MEC/IBC):

- alfabeto, ç e vogais acentuadas
- sinal de maiúscula e de palavra toda em maiúsculas (caixa alta), incluindo siglas com pontos
- sinal de número, vírgula decimal e separador de classes (só em números com mais de 4 algarismos)
- ordinais (1º, 7ª, 10ºs)
- sinal de minúscula latina entre número e letra de a até j
- pontuação, reticências, travessão, aspas, cifrão, por cento, barra e e comercial
- parênteses e colchetes nas formas simples (com números) e compostas (com palavras)

## Estrutura dos arquivos

| Arquivo | Função |
|---|---|
| `index.html` | estrutura da página |
| `style.css` | visual |
| `braille.js` | regras e tradução, sem depender da página |
| `tests.js` | testes de validação |
| `app.js` | botões e interface |

As regras ficam isoladas em `braille.js`. Se a norma mudar, só esse arquivo precisa ser alterado, e os testes mostram na hora se algo quebrou.

## Como usar

Abra o `index.html` no navegador, ou acesse a versão publicada pelo GitHub Pages.

## Como rodar os testes

No navegador: aba **Método e Validação → Testes → Rodar testes**.

No terminal (precisa do [Node.js](https://nodejs.org)):

```
node tests.js
```

## Limitações conhecidas

Algumas celas têm mais de um significado, e o Braille depende do contexto para diferenciá-las:

- o ponto 3 é tanto ponto final quanto apóstrofo, então "d'água" é lido como "d.água";
- o separador de milhar pode ser espaço ou ponto no texto em tinta, mas vira a mesma cela, então "10 000" é lido como "10.000";
- a cela do ç também representa o & (e comercial); o programa só lê & quando a cela aparece sozinha.

**O tradutor pode errar.** Confira textos importantes com a norma oficial ou com uma pessoa que leia Braille. A tela não substitui o papel: o Braille só é lido pelo tato.

## Fonte

BRASIL. Ministério da Educação. Secretaria de Modalidades Especializadas de Educação. *Grafia Braille para a Língua Portuguesa*. Brasília: MEC/SEMESP, 2018.

## Créditos

Grupo: _(nomes dos integrantes)_

Desenvolvido com auxílio do Claude (Anthropic).
