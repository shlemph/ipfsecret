'use strict';
const path = require('path'),
    fs = require('fs'),
    util = require('util'),
    readFile = util.promisify(fs.readFile);

module.exports = exports = function (config) {

    const css = this;

    css.read = (opt) => {
        const base  = config.ipfs.mainSubdir + path.sep + config.ipfs.css.base.path;
        const dialog  = config.ipfs.mainSubdir + path.sep + config.ipfs.css.dialog.path;
        const fonts = config.ipfs.mainSubdir + path.sep + config.ipfs.css.fonts.path;
        const main  = config.ipfs.mainSubdir + path.sep + config.ipfs.css.main.path;
        const map  = config.ipfs.mainSubdir + path.sep + config.ipfs.css.map.path;

        if (!opt.baseCss)
            opt.baseCss = require.resolve(config.ipfs.css.base.source);
        if (!opt.dialogCss)
            opt.dialogCss = __dirname + path.sep + '..' + path.sep + '..' + path.sep + '..' +
                path.sep + config.ipfs.css.dialog.source;
        if (!opt.fontCss)
            opt.fontCss = __dirname + path.sep + '..' + path.sep + '..' + path.sep + '..' +
                path.sep + config.ipfs.css.fonts.source;
        if (!opt.mainCss)
            opt.mainCss = require.resolve(config.ipfs.css.main.source);
        if (!opt.mapCss)
            opt.mapCss = require.resolve(config.ipfs.css.map.source);

        return [
            {path: opt.directory + base,
             content: opt.baseCss},
            {path: opt.directory + dialog,
             content: opt.dialogCss},
            {path: opt.directory + fonts,
             content: opt.fontCss},
            {path: opt.directory + main,
             content: opt.mainCss},
            {path: opt.directory + map,
             content: opt.mapCss}
        ];
    };

    css.get = (cssEntries) => {
        return readFile(cssEntries[0].content)
            .then(base => {
                cssEntries[0].content = base;
                return getFontStyles(cssEntries);
            })
            .catch(err => {
                throw err;
            });
    };

    function getDialog(cssEntries) {
        return readFile(cssEntries[1].content)
            .then(fonts => {
                cssEntries[1].content = fonts;
                return getMain(cssEntries);
            })
            .catch(err => {
                throw err;
            });
    }

    function getFontStyles(cssEntries) {
        return readFile(cssEntries[2].content)
            .then(fonts => {
                cssEntries[2].content = fonts;
                return getDialog(cssEntries);
            })
            .catch(err => {
                throw err;
            });
    }

    function getMain(cssEntries) {
        return readFile(cssEntries[3].content)
            .then(main => {
                cssEntries[3].content = main;
                return getMap(cssEntries);
            })
            .catch(err => {
                throw err;
            });
    }

    function getMap(cssEntries) {
        return readFile(cssEntries[4].content)
            .then(map => {
                cssEntries[4].content = map;
                return cssEntries;
            })
            .catch(err => {
                throw err;
            });
    }

};
