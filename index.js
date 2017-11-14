'use strict';
const through = require('through2'),
    Crypto = require('./lib/crypto'),
    Indexer = require('./lib/indexer'),
    Pkg = require('./package.json'),
    Util = require('./lib/util');

module.exports = exports = function (ipfsOpts) {

    ipfsOpts = ipfsOpts || {};

    const util = new Util(exports.DEBUG, ipfsOpts),
        crypto = new Crypto(util),
        idx = new Indexer(util),
        ipfss = this;

    util.debug('Debugging enabled.');

    ipfss.add = (path, opt) => {
        if (opt.indexed) return idx.create(opt, path, crypto.init);
        else return crypto.encrypt(opt, path);
    };

    ipfss.addIndexed = (path, opt) => {
        if (typeof opt === 'string') opt = {passphrase: opt};
        opt.indexed = true;
        return idx.create(opt, path, crypto.init);
    };

    ipfss.get = (hash, opt) => {
        const stream = through.obj(
            function decrypt(entry, enc, callback) {
                if (entry.content)
                    entry = crypto.decrypt(opt, entry);
                this.push(entry);
                callback();
            }
        );
        return crypto.decryptStream(hash, stream)
    };

    ipfss.getGatewayList = () => {
        return util.cfg.ipfs.gateways
    };

    ipfss.version = exports.version = Pkg.version;

    if (process.env.IPFSECRET_ENV === 'test') {
        ipfss.fonts = idx.fonts;
        ipfss.css = idx.css;
        ipfss.js = idx.js;
    }
};
