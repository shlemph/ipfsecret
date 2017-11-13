const bs58 = require('bs58');

module.exports = exports = function (config) {

    const esRegex = new RegExp(config.ipfs.encryptedSuffix + '$'),
        h = this;

    h.findRoot = (opt, results) => {
        // cover case of single file being wrapped with web UI
        if (opt.indexed) {
            let numEncrypted = 0;
            results.forEach(r => {
                if ((r.path).match(esRegex)) numEncrypted++;
            });
            if (numEncrypted === 1)
                return handleSingleFile(opt, results, esRegex);
        }

        if (results.length === 1)
            return new Buffer(bs58.decode(results[0].hash));
        else {
            const last = results[results.length -1];
            if (last.path === opt.directory)
                return new Buffer(bs58.decode(last.hash));
            else
                throw (new Error(config.err.notAHash));
        }
    };

    h.validate = (hash) => {
        if (typeof hash === 'string') hash = new Buffer(bs58.decode(hash))
        else if (!(hash instanceof Buffer)) throw new Error(config.err.notAHash);
        return hash;
    };

    function handleSingleFile(opt, results, esRegex) {
        let hash;
        if (opt.indexed) {
            results.forEach(r => {
                if ((r.path) === opt.directory) {
                    hash = Buffer(bs58.decode(r.hash));
                }
            });
        }
        else {
            results.forEach(r => {
                if ((r.path).match(esRegex)) {
                    hash = Buffer(bs58.decode(r.hash));
                }
            });
        }
        return hash;
    }

};
