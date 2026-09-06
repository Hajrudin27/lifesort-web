/**
 * Byggeklods til PostgREST-filtre hvor en del af filteret kommer fra brugeren.
 *
 * `.or()` tager ikke en værdi, men et helt filterudtryk som tekst. Sat sammen med
 * strenginterpolation bestemmer brugerens søgetekst derfor selve forespørgslen:
 *
 *   søgetekst "zzz,subject.ilike."  ->  name.ilike.%zzz,subject.ilike.%,email.ilike...
 *
 * Kommaet afslutter det første filter, og resten bliver til et nyt. Målt mod PostgREST
 * returnerede den søgning ALLE supportsager, selvom teksten ikke matchede nogen af dem.
 * Det samme gjaldt den anden vej: en helt almindelig søgning med et komma i — "Anna, Bo" —
 * fejlede med en parse-fejl i stedet for at søge.
 *
 * PostgREST tillader at citere en værdi med dobbelte anførselstegn, og inde i citatet
 * escapes " som \". Så længe alt brugerinput går gennem den vej, er søgeteksten data.
 */

function quoteFilterValue(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * Et `or`-filter der søger efter `term` som delstreng i hver af `columns`.
 *
 * % og _ beholder deres betydning som jokertegn i ilike — det er en søgefunktion, og et
 * jokertegn kan ikke gøre andet end at udvide resultatet inden for de rækker RLS allerede
 * tillader.
 */
export function orIlikeFilter(columns: readonly string[], term: string): string {
  const value = quoteFilterValue(`%${term}%`);
  return columns.map((column) => `${column}.ilike.${value}`).join(',');
}
