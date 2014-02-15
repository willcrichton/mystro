var nodestatic = require('node-static');
var fs = new nodestatic.Server('./www');
var server = require('http').createServer(function(request, response) {
    request.addListener('end', function() {
        fs.serve(request, response);
    }).resume();
});
server.listen(7000);

var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {
    console.log('Someone connected');
});

