'use strict';
const dir = require('node-dir'),
    fs = require('fs'),
    path = require('path'),
    u = require('util'),
    fsStat = u.promisify(fs.stat),
    readDir = u.promisify(fs.readdir),
    Html = require('./html.js'),
    Static = require('./static');

module.exports = exports = function (util) {
    const indexer = this,
        html = new Html(util),
        _static = new Static(util);

    indexer.create = (opt, path, encrypt) => {
        opt = util.validateOpt(opt);
        return util.setPaths(opt, path)
            .then(paths => {return getAllEntries(opt, paths, encrypt);})
            .catch(err => {throw err;});
    };

    function checkItems(opt, paths, items) {
        let promises = [];
        promises.push(new Promise((resolve, reject) => {
            resolve(html.getHeader(opt, paths));
        }));
        for (let j=0; j < items.length; j++) {
            (function (item) {
                promises.push(new Promise((resolve, reject) => {
                    let itemOnFs = paths.source.abs + '/' + item;
                    if (paths.type === 'file') itemOnFs = paths.source.abs;
                    fsStat(itemOnFs)
                        .then(stats => {
                            listItem(opt, stats, item, resolve, reject);
                        })
                        .catch(err => {reject(util.cfg.err.noStat + err);});
                }));
            })(items[j]);
        }
        return promises;
    }

    function finish(opt, paths, encrypt, assets, indices) {
        return html.createPointers(opt, paths)
            .then(pointers => {
                return encrypt(opt, paths)
                    .then(files => {
                        if ((files.length === 1) && pointers[0]) pointers.pop();
                        const all = assets.concat(files, indices, pointers);
                        return util.addToIPFS(opt, all);
                    })
                    .catch(err => {throw err;});
            })
            .catch(err => {throw err;});
    }

    function getAllEntries(opt, paths, encrypt) {
        return _static.getAssets(opt)
            .then(assets => {
                return createIndices(opt, paths)
                    .then(indices => {
                         return finish(opt, paths, encrypt, assets, indices);
                    })
                    .catch(err => {throw err;});
            })
            .catch(err => {throw err;});
    }

    function createIndices(opt, paths) {
        if (paths.type === 'dir') {
            return new Promise((resolve, reject) => {
                dir.subdirs(paths.source.clean, function(err, subdirs) {
                    if (err) reject(err);
                    if (subdirs) {
                        subdirs.push(paths.source.clean);
                        const promises = readSubdirs(opt, subdirs);
                        Promise.all(promises)
                            .then(indices => {
                                resolve(indices);
                             })
                            .catch(err => {reject(err);});
                    }
                    else reject(new Error(util.cfg.err.noRead +
                        paths.source.clean));
                });
            });
        }
        else if (paths.type === 'file') {
            const file = path.basename(paths.ipfs.item);
            const promises = checkItems(opt, paths, [file]);
            return Promise.all(promises)
                .then(items => {
                    return html.finish(paths, items);
                })
                .catch(err => {throw err;});
        }
        else {throw new Error(util.cfg.err.noStat + ' ' + path);}
    }

    function listDir(item, stats) {
        let content = html.createLink(item, item, true, true);
        return html.addRow(content, '', (new Date(stats.mtimeMs))
            .toUTCString(), '');
    }

    function listFile(opt, item, stats) {
        let dButton = '', href = '', isLinked = false;
        if (stats.size > 0) {
            dButton = html.decryptButton();
            href = `${ item }.${ opt.suffix }`;
            isLinked = true;
        }
        return html.addRow(
            html.createLink(href, item, isLinked, false),
            stats.size,
            (new Date(stats.mtimeMs)).toUTCString(),
            dButton
        );
    }

    function listItem(opt, stats, item, resolve, reject) {
        if (qualifies(opt, item, stats.size)) {
            if (stats.isDirectory()) {resolve(listDir(item, stats));}
            else if (stats.isFile()) {resolve(listFile(opt, item, stats));}
            else reject(new Error(util.cfg.err.noStat));
        }
        else {resolve('');}
    }

    function qualifies(opt, item, size) {
        if ((opt.hidden || (!item.match(/^\./))) && size > 0) return true;
        return false;
    }

    function readSubdir(opt, paths) {
        return readDir(paths.source.abs).then(items  => {
            const promises = checkItems(opt, paths, items);
            return Promise.all(promises)
                .then(items => {return html.finish(paths, items);})
                .catch(err => {throw err;});
        })
        .catch(err => {throw err;});
    }

    function readSubdirs(opt, subdirs) {
        let promises = [];
        for (let i=0; i < subdirs.length; i++) {
            (function (subdir) {
                promises.push(new Promise((resolve, reject) => {
                    util.setPaths(opt, subdir)
                        .then(paths => {
                            readSubdir(opt, paths)
                                .then(indexPage => {resolve(indexPage);})
                                .catch(err => {reject(err);});
                        })
                        .catch(err => {reject(err);});
                }));
            })(subdirs[i]);
        }
        return promises;
    }

    if (process.env.IPFSECRET_ENV === 'test') {
        indexer.css = _static.css;
        indexer.fonts = _static.fonts;
        indexer.js = _static.js;
    }

};
