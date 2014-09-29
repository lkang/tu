// tu.js
// Tessel (comm)Unicator
//
var net = require('net');

var PORT = 8052;
var startNodes = ['192.168.1.6', '192.168.1.24', '192.168.1.100'];
var nodes = [];
var newNodes = [];

findNodes(startNodes);

//connect to a known nodes
function findNodes(nodelist) {
  nodelist.forEach(function(node) {
    var nc = new nodeClient(node);
    nc.connect();
  });
}

function nodeClient(ipaddr) {
  var socket = new net.Socket();

  this.connect = function() {
    socket.setTimeout(1000, function() {
      console.log('trying to connect to: ' + ipaddr)
      socket.connect(PORT, ipaddr);
    });
  };

  socket.on('connect', function() {
    // socket.write(socket.localAddress)
    console.log('sending hello from: ' + socket.localAddress);
    socket.write('hello from :' + socket.localAddress);
  });

  socket.on('data', function(data) {
    // should receive a list of other servers.
    console.log('Received data: ' + data);
    if(nodes.indexOf(socket.remoteAddress) == -1) {
      nodes.push(socket.remoteAddress);
    }

    var newArray = JSON.parse(data);
    console.log('nodes: ' + nodes);
    var addedNodes = newArray.diff(nodes);
    console.log('addedNodes: ' + addedNodes);
    var newAddedNodes = addedNodes.diff(newNodes);
    console.log('newAddedNodes: ' + newAddedNodes);
    newNodes = newNodes.concat(newAddedNodes);
    console.log('newNodes: ' + newNodes);

    findNodes(newAddedNodes);

    socket.destroy();
  });

  socket.on('close', function(data) {
    console.log('Closed socket: ' + socket.remoteAddress);
  });

  socket.on('error', function(error) {
    console.log('error from socket: ' + socket.remoteAddress + ' :' + error); 
  });
}

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

//server
var server = net.createServer();
server.on('connection', function (socket) {
  console.log('Connected: ' + socket.remoteAddress + ':' + socket.remotePort);
  socket.on('data', function(data) {
    console.log('got data: ' + data);
    if (nodes.indexOf(socket.remoteAddress) == -1) {
      nodes.push(socket.remoteAddress);
    }
    console.log('responding with nodes: ' + nodes)
    socket.write(JSON.stringify(nodes));
  });
  socket.on('close', function(data) {
    console.log('closed socket');
  });
});

server.listen(PORT)
