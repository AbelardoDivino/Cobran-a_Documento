/* Garante que o CRA suba na porta 3000 (a única origem autorizada no Google).
 * Sem isso, o react-scripts sobe em 3001 quando 3000 está ocupada e o login
 * com Google falha com "origin_mismatch".
 */
const net = require('net');

const port = Number(process.env.PORT || 3000);
const server = net.createServer();

server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\nPorta ${port} já está em uso. O Google só autoriza http://localhost:${port}.\n` +
        'Encerre o outro processo (ex.: outra aba do npm start) e tente de novo.\n'
    );
    process.exit(1);
  }
  throw err;
});

server.once('listening', () => server.close(() => process.exit(0)));
server.listen(port);
