// Shared hosts often enforce a low process/thread limit. Rolldown uses Rayon,
// so keep its worker pool within that limit before Vite loads the native module.
process.env.RAYON_NUM_THREADS = '1';

await import('../node_modules/vite/dist/node/cli.js');
