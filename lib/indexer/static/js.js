'use strict';
const path = require('path'),
    pkg  = require('../../../package.json'),
    fs = require('fs'),
    util = require('util'),
    readFile = util.promisify(fs.readFile);

module.exports = exports = function (config) {

    const js = this;

    js.load = (opt) => {
        return read(opt)
            .then(j => {return j;})
            .catch(err => {throw err;});
    };
    
    function read(opt)  {
        opt = opt || {directory: pkg.name};
        const jsEntry = createMainEntry(opt);
        return readFile(jsEntry.content)
            .then(js => {
                jsEntry.content = js;
                return [jsEntry];
            })
            .catch(err => {throw err;});
    }
    
    function createMainEntry(opt) {
        const jsLib = config.ipfs.cryptoLib,
            subdir = config.ipfs.mainSubdir + '/' + jsLib.path;
        if (!opt.jsPath)
            opt.jsPath = __dirname + path.sep + '..' + path.sep +
                '..' + path.sep + '..' + path.sep + jsLib.source.name;
        return {
            path: opt.directory + subdir,
            content: opt.jsPath
        };
    }

    function createMitmEntry(opt) {
        const mitmHTML = config.ipfs.mitm,
            subdir = mitmHTML.path;
        if (!opt.mitmPath)
            opt.mitmPath = __dirname + path.sep + '..' + path.sep +
                '..' + path.sep + '..' + path.sep + mitmHTML.source;
        return {
            path: opt.directory + '/' + subdir,
            content: opt.mitmPath
        };
    }

    function createServiceWorkerEntry(opt) {
        const serviceWorker = config.ipfs.serviceWorker,
            subdir = serviceWorker.path;
        if (!opt.serviceWorkerPath)
            opt.serviceWorkerPath = __dirname + path.sep + '..' + path.sep +
                '..' + path.sep + '..' + path.sep + serviceWorker.source;
        return {
            path: opt.directory + '/' + subdir,
            content: opt.serviceWorkerPath
        };
    }

    if (process.env.IPFSECRET_ENV === 'test') {
        js.read = read;
    }
};
