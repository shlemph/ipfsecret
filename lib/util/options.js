const  pkg  = require('../../package.json'),
    path = require('path');

module.exports = exports = function (config, u) {

    const esRegex = new RegExp(config.ipfs.encryptedSuffix + '$'),
        o = this;

    o.setWcrypt = (opt) => {
        let wOpt = {};
        if (opt.wcrypt) {
            wOpt = opt.wcrypt;
            if (opt.passphrase) {
                if (!wOpt.material) wOpt.material = {};
                wOpt.material.passphrase = opt.passphrase;
            }
        }
        else wOpt = {material: {passphrase: opt.passphrase}};
        return wOpt;
    };

    o.validate = (opt) => {
        opt = checkOptions(opt);
        opt = adjustPaths(opt);
        if (hasPassphrase(opt)) {
            let clone = JSON.parse(JSON.stringify(opt));
            clone.passphrase = u.cfg.err.redacted;
            u.debug('Options: ' + JSON.stringify(clone));
            return opt;
        }
        else throw new Error(config.err.passReqd);
    };

    function adjustPaths(opt) {
        if (!opt.directory) opt.directory = pkg.name;
        if (!opt.suffix) opt.suffix = config.ipfs.encryptedSuffix;
        return opt;
    }

    function checkOptions(opt) {
        if (typeof opt === 'number' || Array.isArray(opt))
            throw new Error(config.err.passOrOpt);
        else if (typeof opt === 'string')
            return {directory: pkg.name, passphrase: opt};
        else {
            return opt ||  {
                directory: pkg.name,
                hidden: true,
                wcrypt: {material: {passphrase: ''}}
            };
        }
    }

    function hasPassphrase(opt) {
        if ((!opt.passphrase && !opt.wcrypt) ||
            (!opt.passphrase && opt.wcrypt && !opt.wcrypt.material) ||
            (!opt.passphrase && opt.wcrypt && opt.wcrypt.material
                && !opt.wcrypt.material.passphrase)) {
            return false;
        }
        else {
            return true;
        }
    }

};
