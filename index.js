const net = require('net');
//start
var port = (process.env[2] || 3301)*1; // default port = 3301; and if provided at argv then convert it into number
const server = net.createServer();
//main
server.on('connection', (clientToProxySocket) => {
  console.log('Client Connected To Proxy');
  // We need only the data once, the starting packet
  clientToProxySocket.once('data', (data) => {
    let isTLSConnection = data.toString().indexOf('CONNECT') !== -1;
  
    //Considering Port as 80 by default 
    let serverPort = 80;
    let serverAddress;
    if (isTLSConnection) {
      // Port changed to 443, parsing the host from CONNECT 
      serverPort = 443;
      serverAddress = data.toString()
                          .split('CONNECT ')[1]
                          .split(' ')[0].split(':')[0];
    } else {
       // Parsing HOST from HTTP
       serverAddress = data.toString()
                           .split('Host: ')[1].split('\r\n')[0];
    }
    let proxyToServerSocket = net.createConnection({
      host: serverAddress,
      port: serverPort
    }, () => {
      if (isTLSConnection) {
        console.log(`HTTPS ${serverAddress} ${serverPort}`)
        //Send Back OK to HTTPS CONNECT Request
        try { clientToProxySocket.write('HTTP/1.1 200 OK\r\n\n'); } catch (e) {
          console.log('Error: '+e);
        }
      } else {
        console.log(`HTTP ${serverAddress} ${serverPort}`)
        try { proxyToServerSocket.write(data); } catch(e) { 
          console.log('Error: '+e);
        }
      }
      // Piping the sockets
      clientToProxySocket.pipe(proxyToServerSocket);
      proxyToServerSocket.pipe(clientToProxySocket);
      
      proxyToServerSocket.on('error', (err) => {
        console.log('PROXY TO SERVER ERROR');
        console.log(err);
      });
    });
  });
});
server.on('error', (err) => {
  console.log('SERVER ERROR');
  console.log(err);
});
server.on('close', () => {
  console.log('Client Disconnected');
});
server.listen(port, async () => {
  console.log('Server runnig at http://127.0.0.1:' + port);
});
