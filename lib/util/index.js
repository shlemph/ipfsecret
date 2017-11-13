const config = require('../../lib/config.json'),
    ipfsAPI = require('ipfs-api'),
    pkg  = require('../../package.json'),
    path = require('path'),
    Hashes = require('./hashes.js'),
    Options = require('./options.js'),
    Paths = require('./paths.js');

module.exports = exports = function (isDebug, ipfsOpts) {

    const ipfs = ipfsAPI(
        ipfsOpts.host || config.ipfs.host,
        ipfsOpts.port || config.ipfs.port,
        {protocol:ipfsOpts.proto || config.ipfs.proto}
    );

    const esRegex = new RegExp(config.ipfs.encryptedSuffix + '$'),
        util = this,
        h = new Hashes(config),
        o = new Options(config, util),
        p = new Paths(config);

    util.addToIPFS = (opt, assets) => {
        if (opt.root) return util.root(opt, assets);
        else return ipfs.files.add(assets);
    }

    util.cfg = config;

    util.debug = function () {
        if (isDebug) {
            let msg = Array.prototype.slice.call(arguments);
            msg.unshift((new Date()).toString());
            msg.unshift('[debug] ');
            msg = msg.join(' ');
            console.error(msg);
        }
    };

    //stackoverflow.com/a/18650828
    util.format = (bytes, decimals) => {
        if(bytes === 0) return '0 B';
        if (!bytes) return '';
        const k = 1024,
            dm = decimals || 2,
            sizes = ['B','KB','MB','GB','TB','PB','EB','ZB','YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes/Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    util.getFromIPFS = (hash, stream) => {
        return ipfs.files.get(hash)
            .then(s => {return s.pipe(stream);})
            .catch(err => {console.error(err);});
    };

    util.root = (opt, assets) => {
        return ipfs.files.add(assets)
            .then(results => {
                return h.findRoot(opt, results);
            })
            .catch(err => {throw err;});
    };

    util.setFile = (paths, filename) => { return p.setFile(paths, filename); };
    util.setPaths = (opt, arg) => { return p.setPaths(opt, arg); };
    util.setWcrypt = (opt) => { return o.setWcrypt(opt); };
    util.validateHash = (hash) => { return h.validate(hash); };
    util.validateOpt = (opt) => { return o.validate(opt); };

};
