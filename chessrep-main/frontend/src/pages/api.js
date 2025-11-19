// api.js - Simple API wrapper using localStorage since we don't have a backend
const API = {
  get: (url) => {
    const data = localStorage.getItem('chess-games') || '[]';
    const games = JSON.parse(data);
    if (url === '/games') {
      return Promise.resolve({ data: games });
    }
    const id = url.split('/').pop();
    const game = games.find(g => g.id === id);
    if (!game) {
      return Promise.reject({ status: 404 });
    }
    return Promise.resolve({ data: game });
  },
  post: (url, payload) => {
    const data = localStorage.getItem('chess-games') || '[]';
    const games = JSON.parse(data);
    const existingIndex = games.findIndex(g => g.id === payload.id);
    if (existingIndex >= 0) {
      games[existingIndex] = payload;
    } else {
      games.push(payload);
    }
    localStorage.setItem('chess-games', JSON.stringify(games));
    return Promise.resolve({ data: { status: existingIndex >= 0 ? 'updated' : 'created' } });
  }
};

export default API;





