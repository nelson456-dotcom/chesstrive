const axios = require('axios');
const {
  normalizeThemeInput,
  doesPuzzleMatchTheme
} = require('../utils/themeUtils');

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const SAMPLE_SIZE = parseInt(process.env.THEME_SAMPLE_SIZE || '5', 10);

const fetchAvailableThemes = async () => {
  const { data } = await axios.get(`${API_BASE}/api/puzzles/themes`);
  return data.themes?.map(theme => theme.code).filter(Boolean) || [];
};

const verifyTheme = async (themeCode) => {
  const normalized = normalizeThemeInput(themeCode);
  const { data } = await axios.get(`${API_BASE}/api/puzzles/theme/${encodeURIComponent(themeCode)}?count=${SAMPLE_SIZE}`);

  const mismatches = [];
  for (const puzzle of data.puzzles || []) {
    if (!doesPuzzleMatchTheme(puzzle, normalized)) {
      mismatches.push({
        id: puzzle._id,
        fen: puzzle.fen,
        theme: puzzle.theme,
        themes: puzzle.themes
      });
    }
  }

  return {
    code: themeCode,
    normalized,
    checked: data.puzzles?.length || 0,
    mismatches
  };
};

const run = async () => {
  try {
    console.log('🔍 Verifying puzzle themes...');
    const themes = await fetchAvailableThemes();
    if (themes.length === 0) {
      console.log('⚠️ No themes returned by API');
      return;
    }

    const results = [];
    for (const code of themes) {
      try {
        const result = await verifyTheme(code);
        results.push(result);
        if (result.mismatches.length === 0) {
          console.log(`✅ ${code}: ${result.checked} puzzles checked`);
        } else {
          console.log(`❌ ${code}: ${result.mismatches.length} mismatches`);
          result.mismatches.forEach(m => {
            console.log(`   - Puzzle ${m.id} returned theme '${m.theme}' (expected '${result.normalized}')`);
          });
        }
      } catch (error) {
        console.error(`⚠️ Failed to verify theme '${code}':`, error.message);
      }
    }

    const totalMismatches = results.reduce((sum, r) => sum + r.mismatches.length, 0);
    console.log('\n📊 Verification summary');
    console.log(`   Themes checked: ${results.length}`);
    console.log(`   Total puzzles sampled: ${results.reduce((sum, r) => sum + r.checked, 0)}`);
    console.log(`   Total mismatches: ${totalMismatches}`);

    if (totalMismatches === 0) {
      console.log('🎉 All sampled puzzles matched their requested themes.');
    } else {
      console.log('⚠️ Some puzzles did not match their requested themes. See logs above for details.');
    }
  } catch (error) {
    console.error('🚨 Verification failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
};

run();

