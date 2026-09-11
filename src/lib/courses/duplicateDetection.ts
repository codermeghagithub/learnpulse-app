// Intelligent duplicate course title detection
// Handles case-insensitivity, punctuation, acronyms, word-order, filler words, and fuzzy typos.

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingTitle?: string;
  reason?: string;
}

// Common academic CS acronym dictionary
const ACRONYM_MAP: Record<string, string> = {
  dsa: "data structures and algorithms",
  os: "operating systems",
  dbms: "database management systems",
  cn: "computer networks",
  ai: "artificial intelligence",
  ml: "machine learning",
  dl: "deep learning",
  nlp: "natural language processing",
  dmw: "data mining and warehousing",
  dwdm: "data mining and warehousing",
  dmdw: "data mining and warehousing",
  se: "software engineering",
  swe: "software engineering",
  toc: "theory of computation",
  cd: "compiler design",
  coa: "computer organization and architecture",
  cao: "computer organization and architecture",
  oop: "object oriented programming",
  oops: "object oriented programming",
  daa: "design and analysis of algorithms",
  ada: "analysis and design of algorithms",
  wt: "web technologies",
  cc: "cloud computing",
  cns: "cryptography and network security",
  cg: "computer graphics",
  iot: "internet of things",
  hci: "human computer interaction",
};

// Common academic prefixes/filler words that often get prepended to course names
const FILLER_PREFIXES = [
  /^intro(duction)?\s+to\s+/i,
  /^fundamentals?\s+of\s+/i,
  /^principles?\s+of\s+/i,
  /^foundations?\s+of\s+/i,
  /^basics?\s+of\s+/i,
  /^course\s+on\s+/i,
  /^advanced\s+/i,
  /^applied\s+/i,
];

/**
 * Normalizes a single token by stripping common plural suffixes
 * without mangling words like 'process' or 'analysis'.
 */
function stemToken(token: string): string {
  if (token.endsWith("ies")) {
    return token.slice(0, -3) + "y";
  }
  if (token.endsWith("ses") || token.endsWith("xes") || token.endsWith("ches") || token.endsWith("shes")) {
    return token.slice(0, -2);
  }
  if (token.endsWith("s") && !token.endsWith("ss") && !token.endsWith("us") && !token.endsWith("is")) {
    return token.slice(0, -1);
  }
  return token;
}

/**
 * Standardizes a title into canonical representation:
 * 1. Lowercase & strip symbols (& -> and, + -> plus)
 * 2. Expand known acronyms (dsa -> data structures and algorithms)
 * 3. Tokenize, stem, and sort words to handle word-order variations
 */
export function canonicalizeCourseTitle(rawTitle: string): {
  normalized: string;
  stemmedSorted: string;
  coreWithoutFillers: string;
} {
  let cleaned = (rawTitle || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[/@#]/g, " ")
    .replace(/[^a-z0-9\s]/g, "") // remove all remaining punctuation
    .replace(/\s+/g, " ")
    .trim();

  // Check if entire cleaned string is an acronym (or acronym with spaces/dots)
  const compact = cleaned.replace(/\s+/g, "");
  if (ACRONYM_MAP[compact]) {
    cleaned = ACRONYM_MAP[compact];
  } else if (ACRONYM_MAP[cleaned]) {
    cleaned = ACRONYM_MAP[cleaned];
  }

  // Generate version without filler prefixes
  let coreWithoutFillers = cleaned;
  for (const prefix of FILLER_PREFIXES) {
    if (prefix.test(coreWithoutFillers)) {
      coreWithoutFillers = coreWithoutFillers.replace(prefix, "").trim();
      break;
    }
  }

  // Tokenize, stem each token, sort tokens alphabetically
  const tokens = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map(stemToken)
    .sort();

  const stemmedSorted = tokens.join(" ");

  return {
    normalized: cleaned,
    stemmedSorted,
    coreWithoutFillers,
  };
}

/**
 * Computes standard Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates similarity ratio between 0.0 (completely distinct) and 1.0 (identical).
 */
export function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return 1.0 - dist / maxLen;
}

/**
 * Checks if a candidate title duplicates any existing course title.
 * Inspects:
 * 1. Exact case-insensitive match
 * 2. Acronym expansion (DSA vs Data Structures & Algorithms)
 * 3. Stemmed token match (Operating System vs Operating Systems)
 * 4. Word-order permutations (Algorithms & Data Structures vs Data Structures & Algorithms)
 * 5. Filler prefixes (Introduction to Operating Systems vs Operating Systems)
 * 6. Fuzzy spelling/typo distance (Operatng Systems vs Operating Systems)
 */
export function checkDuplicateCourseTitle(
  candidateTitle: string,
  existingTitles: string[]
): DuplicateCheckResult {
  if (!candidateTitle || !candidateTitle.trim()) {
    return { isDuplicate: false };
  }

  const candidate = canonicalizeCourseTitle(candidateTitle);

  for (const existing of existingTitles) {
    if (!existing || !existing.trim()) continue;

    const current = canonicalizeCourseTitle(existing);

    // 1. Direct normalized match
    if (candidate.normalized === current.normalized) {
      return {
        isDuplicate: true,
        existingTitle: existing,
        reason: `Matches existing course "${existing}".`,
      };
    }

    // 2. Stemmed and sorted token match (handles plurals and word order)
    if (candidate.stemmedSorted === current.stemmedSorted) {
      return {
        isDuplicate: true,
        existingTitle: existing,
        reason: `Matches existing course "${existing}" (identical core curriculum terms).`,
      };
    }

    // 3. Core subject match ignoring introductory fillers
    if (
      candidate.coreWithoutFillers.length >= 4 &&
      current.coreWithoutFillers.length >= 4
    ) {
      if (candidate.coreWithoutFillers === current.coreWithoutFillers) {
        return {
          isDuplicate: true,
          existingTitle: existing,
          reason: `Matches existing course "${existing}" (identical subject topic).`,
        };
      }
    }

    // 4. Fuzzy distance / typo check on normalized strings
    const dist = levenshteinDistance(candidate.normalized, current.normalized);
    const minLen = Math.min(candidate.normalized.length, current.normalized.length);
    const maxLen = Math.max(candidate.normalized.length, current.normalized.length);

    // If both strings are at least 5 chars and edit distance is 1 or 2 (or similarity >= 0.84)
    if (minLen >= 5 && maxLen >= 5) {
      const similarity = 1.0 - dist / maxLen;
      const allowedDistance = maxLen > 15 ? 3 : maxLen > 8 ? 2 : 1;

      if (dist <= allowedDistance || similarity >= 0.84) {
        return {
          isDuplicate: true,
          existingTitle: existing,
          reason: `Too similar to existing course "${existing}" (spelling variation/typo detected).`,
        };
      }
    }

    // 5. Fuzzy distance on stemmed/sorted tokens (catches typos even with different word order)
    const stemmedDist = levenshteinDistance(candidate.stemmedSorted, current.stemmedSorted);
    const maxStemmedLen = Math.max(candidate.stemmedSorted.length, current.stemmedSorted.length);
    if (maxStemmedLen >= 6) {
      const stemmedSimilarity = 1.0 - stemmedDist / maxStemmedLen;
      if (stemmedSimilarity >= 0.85) {
        return {
          isDuplicate: true,
          existingTitle: existing,
          reason: `Too similar to existing course "${existing}" (spelling/ordering variation detected).`,
        };
      }
    }
  }

  return { isDuplicate: false };
}
