import rawLevelData from '../data/botLevels.json';

const levelData = [...rawLevelData].sort((a, b) => a.index - b.index);

export const LEVEL_ORDER = levelData.map((entry) => entry.level);

const clampRating = (rating) => {
  const numeric = Number(rating);
  if (Number.isNaN(numeric)) {
    return 0;
  }
  return numeric;
};

const findLevelEntry = (level) => {
  return levelData.find((entry) => entry.level === level);
};

const findLevelByRating = (rating) => {
  const numericRating = clampRating(rating);

  for (const entry of levelData) {
    const { minRating, maxRating } = entry;
    if (numericRating < minRating) {
      continue;
    }
    if (maxRating === null || numericRating <= maxRating) {
      return entry;
    }
  }

  // Ratings below the first minRating default to the easiest level.
  return levelData[0];
};

export const ratingToLevel = (rating) => {
  const entry = findLevelByRating(rating);
  return entry.level;
};

export const levelToIndex = (level) => {
  const entry = findLevelEntry(level);
  return typeof entry?.index === 'number' ? entry.index : -1;
};

export const levelToEngineParams = (level) => {
  const entry = findLevelEntry(level);

  if (!entry) {
    throw new Error(`Unknown bot level: ${level}`);
  }

  const {
    engine: {
      skillLevel,
      uciLimitStrength,
      uciElo,
      randomness,
      openingBook,
      moveTimeMs,
      timeMode,
      depth,
      nodes
    },
    canonicalRating,
    index
  } = entry;

  return {
    level,
    levelIndex: index,
    canonicalRating,
    skillLevel,
    uciLimitStrength,
    uciElo,
    randomness,
    openingBook,
    moveTimeMs,
    timeMode,
    depth,
    nodes
  };
};

export const deriveBotLevelMeta = (rating) => {
  const entry = findLevelByRating(rating);
  const params = levelToEngineParams(entry.level);

  return {
    level: entry.level,
    levelIndex: entry.index,
    minRating: entry.minRating,
    maxRating: entry.maxRating,
    canonicalRating: entry.canonicalRating,
    engineParams: params,
    rating
  };
};

export default {
  LEVEL_ORDER,
  ratingToLevel,
  levelToIndex,
  levelToEngineParams,
  deriveBotLevelMeta
};








