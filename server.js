import server from './index.js';

server.listen(3000, () => {
  console.log(`Server is listening on port ${3000}`);
});

export default server;


