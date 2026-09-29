import { getOptimalSelfishMoves } from './selfishAi.js';

self.addEventListener('message', event => {
    const { requestId, position } = event.data;
    try {
        const bestMoves = getOptimalSelfishMoves(position);
        if (bestMoves.length === 0) {
            throw new Error('The AI could not find an available move.');
        }
        self.postMessage({
            requestId,
            move: bestMoves[Math.floor(Math.random() * bestMoves.length)],
        });
    } catch (error) {
        self.postMessage({
            requestId,
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
