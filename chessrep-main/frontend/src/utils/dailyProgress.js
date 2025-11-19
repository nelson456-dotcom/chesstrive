// Utility function to update daily progress
export const updateDailyProgress = async (module) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await fetch('http://localhost:3001/api/daily-progress/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ module })
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error updating daily progress:', error);
    return null;
  }
};

// Module name mappings
export const MODULE_NAMES = {
  TACTICS: 'tactics',
  BLUNDER_PREVENTER: 'blunderPreventer',
  INTUITION_TRAINER: 'intuitionTrainer',
  DEFENDER: 'defender',
  ENDGAME: 'endgame',
  VISUALIZATION: 'visualization'
};











