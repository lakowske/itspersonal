/*
 * (C) 2016 Seth Lakowske
 */


var http        = require('http');
var ecstatic    = require('ecstatic');
var dnode       = require('dnode');
var shoe        = require('shoe');

function buildServer(router, staticPath) {

    var st = ecstatic({
        root : staticPath
    });

    var server = http.createServer(function(req, res) {

        var route = router.match(req.url);

        if (route) {
            route.fn.apply(null, [req, res, route.params]);
        } else {
            st(req, res);
        }

    });

    return server;
}

function addSock(server, path, remoteFunctions) {
    var sock = shoe(function (stream) {

        var d = dnode(remoteFunctions)

        d.pipe(stream).pipe(d);
    })

    sock.install(server, path);
}

module.exports.buildServer = buildServer;
module.exports.addSock = addSock;

