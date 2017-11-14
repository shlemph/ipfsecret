'use strict';
const wStream = require('webcrypto-crypt/lib/node-streams.js'),
    Encrypt = require('./encrypt');

module.exports = exports = function (util) {
    const crypto = this,
        encrypt = new Encrypt(util);

    crypto.decrypt = (opt, entry) => {
        opt = util.validateOpt(opt);
        entry.content.on('error', err => {
            util.debug(`${ err } ${ entry.path}`);
            delete entry.content;
        });
        entry.content = wStream.decrypt(opt.passphrase, entry.content);
        entry.path = entry.path.replace('.' + opt.suffix, '');
        return entry;
    };

    crypto.decryptStream = (hash, stream) => {
        hash = util.validateHash(hash);
        return util.getFromIPFS(hash, stream);
    };

    crypto.encrypt = (opt, path) => {
        opt = util.validateOpt(opt);
        return util.setPaths(opt, path)
            .then(paths => {
                return encrypt.init(opt, paths)
                    .then(files => {return util.addToIPFS(opt, files);})
                    .catch(err => {throw err;});
            })
            .catch(err => {throw err;});
    };

    crypto.init = encrypt.init;

    crypto.util = util;

};
