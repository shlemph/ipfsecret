'use strict';
const dir = require('node-dir'),
    fs = require('fs'),
    fsStat = require('util').promisify(fs.stat),
    path = require('path'),
    wcrypt = require('webcrypto-crypt'),
    wStream = require('webcrypto-crypt/lib/node-streams.js');

module.exports = exports = function (util) {

    const encrypt = this;

    encrypt.init = (opt, paths) => {
        const wcryptOptions = util.setWcrypt(opt),
            clone = JSON.parse(JSON.stringify(wcryptOptions));
        encrypt.wcrypt = new wcrypt.cipher(wcryptOptions);
        clone.material.passphrase = util.cfg.err.redacted;
        util.debug('Wcrypt opt: ' + JSON.stringify(clone));
        if (paths.type === 'dir') return encryptDir(opt, paths);
        else if (paths.type === 'file') return encryptFile(opt, paths);
        else {throw new Error(paths.source.abs + util.cfg.err.noSupp);}
    };

    function add(opt, stream, paths, filename) {
        return fsStat(filename).then(stats => {
            if (stats.size > 0)
                return createEntry(opt, paths, stream, filename);
            else
                util.debug(util.cfg.err.zeroByte + filename);return false;
        })
        .catch(err => {throw err;});
    }

    function addFile(opt, paths, entries, err, stream, filename, next) {
        if (err) reject(err);
        if (qualifies(opt, filename)) {
            return add(opt, stream, paths, filename)
                .then(entry => {
                    if (entry) entries.push(entry);
                    next();
                })
                .catch(err => {throw err;});
        }
        else {next();}
    }


    function createEntry(opt, paths, stream, filename) {
        util.debug('Encrypting file: ' + filename);
        paths = util.setFile(paths, filename);
        return {
            path: paths.ipfs.file + '.' + opt.suffix,
            content: wStream.encrypt(encrypt.wcrypt, stream)
        };
    }

    function encryptDir(opt, paths) {
        util.debug('Adding directory ' + paths.source.abs);
        return encrypt.wcrypt.encrypt(Buffer.from(''))
            .then(() => {
                return encrypt.wcrypt.encrypt(Buffer.from(''))
                    .then(() => {return readDir(opt, paths);})
                    .catch((err) => {throw err;});
            })
            .catch((err) => {throw err;});
    }

    function encryptFile(opt, paths) {
        util.debug('Adding file ' + paths.source.abs);
        return encrypt.wcrypt.encrypt(Buffer.from(''))
            .then(() => {
                const cleartextIn = fs.createReadStream(paths.source.abs),
                    encryptedStream = wStream.encrypt(encrypt.wcrypt,
                        cleartextIn);
                return oneFile(opt, paths, encryptedStream);
            })
            .catch((err) => {throw err;});
    }

    function getAllEntries(opt, paths, entries, resolve, reject) {
        let dirOpt;
        if (opt.hidden) dirOpt = {};
        else dirOpt = {exclude: /^\./};
        dirOpt.encoding = null; // force binary
        dir.readFilesStream(paths.source.abs, dirOpt,
            (err, stream, filename, next) => {
                addFile(opt, paths, entries, err, stream, filename, next);
            },
            err => {
                if (err) reject(err);
                else resolve(entries);
            }
        );
    }

    function oneFile(opt, paths, encryptedStream) {
        if (opt.indexed) {
            return new Promise((resolve, reject) => {
                resolve([{
                    path: paths.ipfs.item + '.' + opt.suffix,
                    content: encryptedStream
                }]);
            });
        }
        else {
            return new Promise((resolve, reject) => {
                resolve([{
                    path: path.basename(paths.ipfs.item + '.' + opt.suffix),
                    content: encryptedStream
                }]);
            });
        }
    }

    function qualifies(opt, filename) {
        if (opt.hidden || !filename.match(/\/\./)) return true;
        return false;
    }

    function readDir(opt, paths, entries) {
        entries = entries || [];
        return new Promise((resolve, reject) => {
            getAllEntries(opt, paths, entries, resolve, reject);
        });
    }

};
