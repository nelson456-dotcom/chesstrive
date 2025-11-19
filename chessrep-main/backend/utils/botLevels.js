const path = require('path');

const levelDataPath = path.join(__dirname, '../../frontend/src/data/botLevels.json');
const rawLevelData = require(levelDataPath);

const levelData = [...rawLevelData].sort((a, b) => a.index - b.index);

const levelOrder = levelData.map((entry) => entry.level);

const clampRating = (rating) => {
  const numeric = Number(rating);
  if (Number.isNaN(numeric)) {
    return 0;
  }
  return numeric;
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

  return levelData[0];
};

const findLevelEntry = (level) => levelData.find((entry) => entry.level === level);

const ratingToLevel = (rating) => findLevelByRating(rating).level;

const levelToIndex = (level) => {
  const entry = findLevelEntry(level);
  return typeof entry?.index === 'number' ? entry.index : -1;
};

const levelToEngineParams = (level) => {
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

const deriveBotLevelMeta = (rating) => {
  const entry = findLevelByRating(rating);
  const engineParams = levelToEngineParams(entry.level);
  return {
    level: entry.level,
    levelIndex: entry.index,
    canonicalRating: entry.canonicalRating,
    minRating: entry.minRating,
    maxRating: entry.maxRating,
    engineParams
  };
};

module.exports = {
  levelOrder,
  ratingToLevel,
  levelToIndex,
  levelToEngineParams,
  deriveBotLevelMeta,
  levelData
};

