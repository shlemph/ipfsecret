#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"
'use strict';
var async = require('async'),
    browserify = require('browserify'),
    path = require('path'),
    crypto = require('crypto'),
    distJs = 'ipfsecret.js',
    distFolder = './dist',
    exampleFolder = './examples',
    ipfsecretDir = 'assets/js',
    ipfsecretSrc = 'assets/js' + path.sep + 'ipfsecret-decrypt.js',
    wcryptSrc = require.resolve('webcrypto-crypt/index.js'),
    fs = require('fs'),
    mkdirp = require('mkdirp');

async.series([

    function(callback) {
        var folders = [distFolder, exampleFolder];
        folders.forEach(f => {
            mkdirp(f, function (err) {
                if (err) {
                    console.error('ERROR creating ' + f +
                        ': ' + err.message);
                    process.exit(0);
                }
            });
        });
        callback();
    },

    function(callback) {
        var b = browserify([wcryptSrc, ipfsecretSrc],
            {standalone: 'IPFSecret'}).transform('babelify',
            {presets: ['es2015']});
        b.ignore('node-webcrypto-ossl');
        var jsStream = b.bundle();
        var js = '';
        jsStream.on('data', function (buf) {
            js += buf;
        });
        jsStream.on('end', function () {
            fs.writeFile(distFolder + path.sep + distJs, js, function(err) {
                if(err) {
                    console.error('ERROR creating ' + distJs + ': ' +
                        err.message);
                    process.exit(0);
                }
                const hash = crypto.createHash('sha512');
                hash.update(js);
                fs.writeFile(ipfsecretDir + path.sep + 'sha512.txt',
                    hash.digest('base64'), function(err) {
                    if(err) {
                        console.error('ERROR creating sha512.txt: ' +
                            err.message);
                        process.exit(0);
                    }
                    callback();
                });
            });
        });
    }

]);
