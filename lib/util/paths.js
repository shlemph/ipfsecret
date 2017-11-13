const path = require('path'),
    fs = require('fs'),
    fsStat = require('util').promisify(fs.stat);

module.exports = exports = function (config) {

    const relText = ('^(\\.|\\/' + ')+'),
        relRegex = new RegExp(relText),
        p = this;

    p.setFile = (paths, filename) => {
        paths.ipfs.file = paths.ipfs.item + '/' +
            filename.replace(paths.source.abs + path.sep, '');
        paths.ipfs.file = paths.ipfs.file.replace('//', '/');
        return paths;
    };

    p.setPaths = (opt, arg) => {
        if (typeof arg !== 'string') throw new Error(config.err.pathString);
        return fsStat(arg)
            .then(stats => {
                let paths = createPaths(opt, arg, stats);
                return paths;
            })
            .catch(err => {
                throw new Error(config.err.noStat + err);
            });
    };

    function createPaths(opt, arg, stats) {
        let paths = {source: {}, ipfs: {}};
        if (stats.isDirectory()) paths.type = 'dir';
        else if (stats.isFile()) paths.type = 'file';
        else throw new Error(config.err.noStat + arg);
        paths.source.orig = arg;
        paths.source.clean = validate(arg);
        paths.source.abs = path.resolve(paths.source.clean);
        paths = setIPFSDir(opt, paths);
        return paths;
    }

    function validate(p) {
        try {return path.format(path.parse(p));}
        catch (err) {throw err;}
    }

    function setIPFSDir(opt, paths) {
        const normal = (path.normalize(paths.source.orig))
            .replace(relRegex, '');
        paths.ipfs.item = opt.directory + '/' + normal;
        if (normal.startsWith(path.sep))
            paths.ipfs.item = opt.directory + '/' +
                normal.substring(1, normal.length);
        if (normal.endsWith(path.sep)) paths.ipfs.item = opt.directory + '/' +
               normal.substring(0, normal.length - 1);
        if ((paths.ipfs.item).match(/\/$/)) paths.ipfs.item = paths.ipfs.item.replace(/\/$/,'');
        return paths;
    }

};
