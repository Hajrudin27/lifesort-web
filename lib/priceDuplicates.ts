export type ProductForDuplicateCheck = {
  id: string;
  name: string;
  priceCount: number;
};

export type DuplicateCluster = {
  key: string;
  confidence: 'exact' | 'similar';
  items: ProductForDuplicateCheck[];
};

// Fjerner mellemrum/tegnsætning og sænker store bogstaver, men bevarer æ/ø/å —
// de er selvstændige danske bogstaver, ikke accenter, og skal ikke fjernes.
function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9æøå]/g, '');
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = 1 + Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]);
      }
    }
  }
  return matrix[rows - 1][cols - 1];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

const SIMILARITY_THRESHOLD = 0.85;

/**
 * Grupperer varer, der sandsynligvis er dubletter af hinanden. "exact" betyder
 * identisk efter normalisering (fx forskellig mellemrums-brug), "similar" betyder
 * tæt nok til at være en sandsynlig tastefejl. Varer er ikke længere butiks-scoped —
 * hver vare er nu ét produkt, uanset hvor mange butikker den har en pris i.
 */
export function findDuplicateClusters(products: ProductForDuplicateCheck[]): DuplicateCluster[] {
  const used = new Set<string>();
  const clusters: DuplicateCluster[] = [];

  for (let i = 0; i < products.length; i++) {
    if (used.has(products[i].id)) continue;
    const groupItems = [products[i]];
    const normA = normalize(products[i].name);
    let hasExactMatch = false;

    for (let j = i + 1; j < products.length; j++) {
      if (used.has(products[j].id)) continue;
      const normB = normalize(products[j].name);
      if (normA === normB) {
        groupItems.push(products[j]);
        used.add(products[j].id);
        hasExactMatch = true;
      } else if (similarity(normA, normB) >= SIMILARITY_THRESHOLD) {
        groupItems.push(products[j]);
        used.add(products[j].id);
      }
    }

    if (groupItems.length > 1) {
      used.add(products[i].id);
      clusters.push({
        key: normA,
        confidence: hasExactMatch ? 'exact' : 'similar',
        items: groupItems,
      });
    }
  }

  return clusters;
}
