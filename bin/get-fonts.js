#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

const AdmZip = require('adm-zip'),
    Config = require('../lib/config.json'),
    fs = require ('fs'),
    path = require ('path'),
    https = require ('https'),
    { URL } = require('url'),
    util = require('util'),
    fsUnlink = util.promisify(fs.unlink),
    options = new URL(Config.fonts.sourceUri);

const indexFile = require.resolve('../.'),
    pathParts = indexFile.split(path.sep),
    mainFile = pathParts.pop(),
    fontPath = pathParts.join(path.sep) + path.sep + 'assets' + path.sep + 'fonts';

var destination = fs.createWriteStream(Config.fonts.localFile);
destination.on('finish', () => {
    console.log('Extracting files.');
    var zip = new AdmZip(Config.fonts.localFile);
    zip.extractAllTo(fontPath, true);
    fsUnlink(Config.fonts.localFile)
    .then(() => {
        console.log(Config.fonts.localFile + ' deleted.');
    });
});
destination.on('error', (err) => {
     console.log(err.stack);
});

const req = https.request(options, (res) => {
    res.on('data', (d) => {
        destination.write(d);
    });
    res.on('end', () => {
        destination.end();
    });
});
req.on('error', (e) => {
    console.error(e);
});
req.end();
