'use strict';
const fs = require('fs'),
    path = require('path'),
    pkg  = require('../../../package.json'),
    util = require('util'),
    readDir = util.promisify(fs.readdir),
    readFile = util.promisify(fs.readFile);

module.exports = exports = function (config) {

    const fonts = this;

    fonts.load = (opt) => {
        return read(opt)
            .then(f => {
                return f;
            })
            .catch(err => {
                throw err;
            });
    };

    function findDir(opt) {
        if (!opt.fontsDir) {
            try {
                const indexFile = require.resolve('ipfsecret'),
                    pathParts = indexFile.split(path.sep),
                    mainFile = pathParts.pop(),
                    fontPath = pathParts.join(path.sep) + path.sep + 'assets' +
                        path.sep + 'fonts';
                return fontPath;
            }
            catch (err) {
                return config.fonts.localDir;
            }
        }
    }

    function getFiles(opt, files, fontData) {
        opt = opt || {directory: pkg.name};
        const subdir = config.ipfs.mainSubdir + '/' + config.ipfs.fonts.path;
        let fontEntries = [];
        return Promise.all(fontData)
            .then((values) => {
                for (let i=0; i < values.length; i++) {
                    fontEntries.push({
                        path: opt.directory + subdir + files[i],
                        content: values[i]
                    });
                }
                return fontEntries;
            })
            .catch((err) => {
                console.error(err);
            });
    }

    function read(opt) {
        opt = opt || {directory: pkg.name};
        const fontsDir = findDir(opt);
        return readDir(fontsDir)
            .then((files)  => {
                let fontData = [];
                for (let i=0; i < files.length; i++) {
                    fontData.push(readFile(path.resolve(fontsDir) + '/' + files[i]));
                }
                return getFiles(opt, files, fontData);
            })
            .catch(err => {
               console.error(err);
            });
    }

    if (process.env.IPFSECRET_ENV === 'test') {
        fonts.read = read;
    }

};

