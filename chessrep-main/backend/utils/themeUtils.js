const DEFAULT_THEME = 'tactic';

const toSnakeCase = (value = '') => {
  return value
    .toString()
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
};

const normalizeThemeInput = (theme) => {
  if (!theme) {
    return '';
  }
  const snake = toSnakeCase(theme);
  return snake || theme.toString().trim().toLowerCase();
};

const buildThemeVariants = (theme) => {
  if (!theme) {
    return [];
  }

  const raw = theme.toString().trim();
  const lower = raw.toLowerCase();
  const snake = toSnakeCase(raw);
  const condensed = lower.replace(/[\s_-]+/g, '');

  const variants = new Set([
    lower,
    snake,
    condensed,
    snake.replace(/_/g, ''),
    raw
  ]);

  return Array.from(variants).filter(Boolean);
};

const buildThemeQuery = (theme, normalizedTheme = '') => {
  const variants = new Set([
    ...buildThemeVariants(theme),
    ...buildThemeVariants(normalizedTheme)
  ]);
  if (variants.size === 0) {
    return {};
  }
  const variantsArray = Array.from(variants);

  return {
    $or: [
      { theme: { $in: variantsArray } },
      { themes: { $in: variantsArray } }
    ]
  };
};

const doesPuzzleMatchTheme = (puzzle, theme) => {
  if (!theme) {
    return true;
  }

  const variants = buildThemeVariants(theme);
  if (variants.length === 0) {
    return true;
  }

  const puzzleTheme = puzzle?.theme ? normalizeThemeInput(puzzle.theme) : '';
  if (variants.includes(puzzleTheme) || variants.includes(puzzleTheme.replace(/_/g, ''))) {
    return true;
  }

  if (Array.isArray(puzzle?.themes)) {
    return puzzle.themes.some((pTheme) => {
      const normalized = normalizeThemeInput(pTheme);
      return variants.includes(normalized) || variants.includes(normalized.replace(/_/g, ''));
    });
  }

  return false;
};

module.exports = {
  DEFAULT_THEME,
  normalizeThemeInput,
  buildThemeVariants,
  buildThemeQuery,
  doesPuzzleMatchTheme
};

