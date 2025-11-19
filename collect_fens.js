// JavaScript to run in browser console to collect FENs
// This intercepts API responses and extracts FEN data

(function() {
    const fens = [];
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        
        // Clone response to read it without consuming it
        const clonedResponse = response.clone();
        
        // Check if this is the lessons API
        if (args[0] && args[0].includes('/api/lessons/get_next/')) {
            clonedResponse.json().then(data => {
                console.log('API Response:', data);
                if (data.fen) {
                    fens.push(data.fen);
                    console.log('FEN found:', data.fen);
                } else if (data.position && data.position.fen) {
                    fens.push(data.position.fen);
                    console.log('FEN found:', data.position.fen);
                } else if (data.data && data.data.fen) {
                    fens.push(data.data.fen);
                    console.log('FEN found:', data.data.fen);
                }
                // Store in window for access
                window.collectedFens = fens;
            }).catch(e => console.error('Error parsing response:', e));
        }
        
        return response;
    };
    
    console.log('FEN interceptor installed. FENs will be collected in window.collectedFens');
})();


