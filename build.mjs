import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist',{recursive:true,force:true});
await mkdir('dist/server',{recursive:true});
await mkdir('dist/client',{recursive:true});
await cp('worker.mjs','dist/server/index.js');
await cp('index.html','dist/client/index.html');
await cp('styles.css','dist/client/styles.css');
await cp('src','dist/client/src',{recursive:true});

console.log('BOT CONQUEST production build ready');
