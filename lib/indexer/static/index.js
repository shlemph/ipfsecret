'use strict';
const fs = require('fs'),
    fsStat = require('util').promisify(fs.stat),
    he = require('he'),
    pkg = require('../../../package.json'),
    readFile = require('util').promisify(fs.readFile),
    Css  = require('./css.js'),
    Fonts  = require('./fonts.js'),
    Js  = require('./js.js');

module.exports = exports = function (util) {
    const _static = this,
        fonts = new Fonts(util.cfg),
        css = new Css(util.cfg),
        js = new Js(util.cfg);

    _static.getAssets = (opt) => {
        opt = util.validateOpt(opt);
        return readFiles(opt)
            .then(assets => {return assets;})
            .catch(err => {throw err;});
    };

    function getCSS(opt) {
        opt = opt || {directory: pkg.name};
        const cssEntries = css.read(opt);
        return css.get(cssEntries);
    }

    function getFonts(opt) {
        return fonts.load(opt)
            .then(fontEntries => {return fontEntries;})
            .catch(err => {throw err;});
    }

    function getJs(opt) {
        return js.load(opt)
            .then(jsEntries => {return jsEntries;})
            .catch(err => {throw err;});
    }

    function readFiles(opt) {
        return getCSS(opt).then(cssEntries => {
            return getJs(opt).then(jsEntries => {
                return getFonts(opt).then(fontEntries => {
                    return cssEntries.concat(jsEntries, fontEntries);
                }).catch(err => {throw err;});
            }).catch(err => {throw err;});
        }).catch(err => {throw err;});
    }

    if (process.env.IPFSECRET_ENV === 'test') {
        _static.css = getCSS;
        _static.fonts = getFonts;
        _static.js = getJs;
    }
};
