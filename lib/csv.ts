import Papa from 'papaparse';

/**
 * CSV-eksport af data vi ikke selv har skrevet.
 *
 * To selvstændige problemer skal håndteres på vej ud:
 *
 * 1. Formelinjektion. Excel, Google Sheets og LibreOffice fortolker en celle der begynder
 *    med = + - @ (og tab/CR) som en formel. Supportsager og ventelistemails kommer fra
 *    offentlige formularer, så en fremmed kan bestemme indholdet af en celle, som en admin
 *    senere åbner på sin egen maskine. Sådanne værdier får et foranstillet ' så regnearket
 *    behandler dem som tekst.
 *
 * 2. Struktur. Værdier med komma, citationstegn eller linjeskift skal citeres, ellers kan
 *    én værdi skabe nye felter og nye rækker i filen. Papa.unparse håndterer citeringen —
 *    pointen er at ALLE eksporter går gennem den, i stedet for at sætte strenge sammen selv.
 */

const FORMULA_PREFIXES = new Set(['=', '+', '-', '@']);

function neutralizeText(text: string): string {
  if (text.length === 0) return text;

  const first = text[0];
  if (first === '\t' || first === '\r') return `'${text}`;
  if (!FORMULA_PREFIXES.has(first)) return text;

  // Et rent tal er ikke en formel: "-12" og "+3" skal blive ved med at være tal i regnearket.
  if (text.trim() !== '' && Number.isFinite(Number(text))) return text;

  return `'${text}`;
}

/** Gør én værdi sikker at lægge i en CSV-celle. Tal og booleans er ufarlige som de er. */
export function neutralizeCsvValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return neutralizeText(value);
  return neutralizeText(JSON.stringify(value));
}

/**
 * Bygger en CSV med korrekt citering, hvor hver celle er neutraliseret.
 * Kolonnenavnene neutraliseres ikke: de er SQL-identifikatorer fra vores eget skema og kan
 * ikke starte med et formeltegn — og Papa bruger dem samtidig som nøgler til at slå
 * værdierne op, så de skal stå uændret.
 */
export function rowsToCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  const cols = columns ?? Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  const safeRows = rows.map((row) => {
    const out: Record<string, string | number | boolean> = {};
    for (const col of cols) out[col] = neutralizeCsvValue(row[col]);
    return out;
  });

  return Papa.unparse(safeRows, { columns: cols });
}
