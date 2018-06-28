const bs58 = require('bs58'),
    Config = require('../lib/config.json'),
    expect = require('expect'),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    readFile = util.promisify(fs.readFile),
    ipfsAPI = require('ipfs-api'),
    ipfs = ipfsAPI(
        Config.ipfs.host,
        Config.ipfs.port,
        {protocol:Config.ipfs.proto}
    );
    IPFSecret = require('../index.js'),
    sBuff = require('stream-buffers');
    
process.env.IPFSECRET_ENV = 'test';

function checkCSS(data, done) {
    expect(data.length).toEqual(5);
    data.forEach(d => {
        expect(d).toHaveProperty('path');
        expect(d).toHaveProperty('content');
    });
    expect(data[0].content.toString('utf8')).toMatch(/normalize.css v7.0.0/);
    expect(data[1].content.toString('utf8')).toMatch(/Modal box Css/);
    expect(data[2].content.toString('utf8')).toMatch(/roboto-300 - latin/);
    expect(data[3].content.toString('utf8')).toMatch(/Milligram/);
    expect(data[4].content.toString('utf8')).toMatch(/"mappings":"/);
    expect(data[5]).toEqual(undefined);
    done();
}

function checkEntryFormat(result, done) {
    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('hash');
    expect(result).toHaveProperty('size');
    done();
}

function checkFonts(data, done) {
    expect(data.length).toEqual(10);
    data.forEach(d => {
        expect(d).toHaveProperty('path');
        expect(d).toHaveProperty('content');
        expect(Buffer.isBuffer(d.content)).toBeDefined();
    });
    expect(data[10]).toEqual(undefined);
    done();
}

function checkIndexContent(ipfsecret, testPass, results, done) {
    const subdir = Config.ipfs.mainSubdir.replace(/^\//, '');
    let hash = '';
    results.forEach(r => {
        if (r.path === subdir + '/' + Config.ipfs.mainIndex)
            hash = r.hash;
    });
    ipfs.get(hash).then(stream => {
        stream.on('data', obj => {
            if (obj.content) {
                const writeable = new sBuff.WritableStreamBuffer(),
                    docType = new RegExp('<!doctype html>', 'g'),
                    dirTest = new RegExp('<td><a href="test/' +
                        Config.ipfs.mainIndex + '">\\[test\\]</a></td>', 'g');
                writeable.on('finish', () => {
                    const results = writeable.getContents().toString('utf8');
                    expect(results).toMatch(docType);
                    expect(results).toMatch(dirTest);
                    done();
                });
                obj.content.pipe(writeable);
                obj.content.on('error', (err) => {done(err);});
            }
        });
    })
    .catch(err => {done(err);});
}

function checkIndices(results, done) {
    const subdir = Config.ipfs.mainSubdir.replace(/^\//, '');
    let expected = [];
    results.forEach(r => {
        if (
            (r.path === subdir + '/' + Config.ipfs.mainIndex) ||
            (r.path === subdir + '/test/' + Config.ipfs.mainIndex)
        ) expected.push(r.path);
    });
    expect(expected.length).toEqual(2);
    done();
}

function checkJS(data, done) {
    expect(data.length).toEqual(1);
    expect(data[0]).toHaveProperty('path');
    expect(data[0]).toHaveProperty('content');
    expect((data[0].content).toString()).toMatch(/webcrypto-crypt/g);
    expect((data[0].content).toString()).toMatch(/"version": "0.1.18"/g);
    done();
}

function checkRelLinks(p, content, run, matched, done) {
    const d = Config.ipfs.mainSubdir.replace(/^\//, ''),
        r = new RegExp(d + '/'),
        t = {
            'ipfsecret.html'                                              : 'ipfsecret/st',
            'node_modules/ipfsecret.html'                                 : '../ipfsecret',
            'node_modules/webcrypto-crypt/ipfsecret.html'                 : '../../ipfsec',
            'node_modules/webcrypto-crypt/examples/ipfsecret.html'        : '../../../ipf',
            'node_modules/webcrypto-crypt/examples/browser/ipfsecret.html': '../../../../'
        };
    if (content) {
        const cssRegex = new RegExp('<link rel="stylesheet" href="(.{12})'),
            writeable = new sBuff.WritableStreamBuffer();
        writeable.on('finish', () => {
            const results = writeable.getContents().toString('utf8');
            if (t[p.replace(r, '')] === results.match(cssRegex)[1]) matched.push(1);
            if (run === Object.keys(t).length) { 
                if (matched.length === Object.keys(t).length) done();
                else (done(new Error(Config.err.relLinks)));
            }
            
        });
        content.pipe(writeable);
        content.on('error', (err) => {done(err);});
    }
}

describe('ipfsecret.addIndexed', () => {
    const testPass = '学年別漢字配当表',
        relLinkTest = './node_modules/webcrypto-crypt/examples',
        testDir = './test',
        testFile = './README.md';

    it('Loads expected CSS files', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.css()
            .then(data => {checkCSS(data, done);})
            .catch(err => {done(err);});
    });

    it('Loads expected JavaScript files', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.js()
            .then(data => {checkJS(data, done);})
            .catch(err => {done(err);});
    });

    it('Loads expected font files', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.fonts()
            .then(data => {checkFonts(data, done);})
            .catch(err => {done(err);});
    });

    it('Generates expected HTML indices', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(testDir, testPass)
            .then(results => {checkIndices(results, done);})
            .catch(err => {done(err);});
    });

    it('Generates expected HTML index content', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(testDir, testPass)
            .then(results => {checkIndexContent(ipfsecret, testPass, results,
                done);})
            .catch(err => {done(err);});
    });

    it('Throws error with no passphrase', (done) => {
        const ipfsecret = new IPFSecret();
        try {
            ipfsecret.addIndexed(testFile);
            done(Config.err.noErr);
        }
        catch(err) {done();}
    });

    it('Returns expected number of objects', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(testFile, testPass)
            .then(results => {
                expect(results.length).toEqual(23);
                done();
            })
            .catch(err => {done(err);});
    });

    it('Returns expected object format', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(testFile, testPass)
            .then(results => {checkEntryFormat(results[0], done);})
            .catch(err => {done(err);});
    });

    it('Accepts a directory', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(testDir, testPass)
            .then(results => {
                expect(results.length).toEqual(28);
                done();
            })
            .catch(err => {done(err);});
    });

    it('Detects passphrase inside Wcrypt options', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(testFile, {
            wcrypt: {material: {passphrase: testPass}}
        })
            .then(results => {
                expect(results.length).toEqual(23);
                done();
            })
            .catch(err => {done(err);});
    });

    it('Detects passphrase outside Wcrypt options', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(testFile, {
            passphrase: testPass
        })
            .then(results => {
                expect(results.length).toEqual(23);
                done();
            })
            .catch(err => {done(err);});
    });

    it('Accepts valid custom Wcrypt options', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(testFile, {
            wcrypt: {
                config: {
                    crypto: {tagLength: 112},
                    derive: {
                        hash: 'SHA-256',
                        length: 192,
                        iterations: 5000
                    }
                },
                material: {passphrase: 'test123'}
            }})
            .then(results => {
                expect(results.length).toEqual(23);
                done();
            })
            .catch(err => {done(err);});
    });

    it('Rejects invalid custom Wcrypt options', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(testFile, {
            wcrypt: {
                config: {
                    crypto: {
                         tagLength: 111
                    },
                    derive: {
                        hash: 'SHA-256',
                        length: 192,
                        iterations: 5000
                    }
                },
                material: {passphrase: 'test123'}
            }}
        )
            .then(results => {done(Config.err.noErr);})
            .catch(err => {done();});
    });

    it('Rejects non-string path', (done) => {
        const ipfsecret = new IPFSecret();
        try {
        ipfsecret.addIndexed([testDir], testPass)
            .then(hash => {done(Config.err.noErr);})
            .catch(err => {done(Config.err.noErr);});
        }
        catch(err) {done();}
    });

    it('Respects root option', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(testDir, {passphrase: testPass, root: true})
            .then(hash => {
                hash = bs58.encode(hash);
                expect(hash.substring(0,2)).toEqual('Qm');
                expect(hash.length).toEqual(46);
                done();
            })
            .catch(err => {done(err);});
    });

    it('Respects directory name option', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(testDir, {
            passphrase: testPass,
            directory: 'shazam'
        })
            .then(results => {
                results.forEach(r => {
                    expect((r.path).match(/^shazam/)).toBeTruthy();
                });
                done();
            })
            .catch(err => {done(err);});
    });

    it('Respects suffix option', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(testDir, {
            passphrase: testPass,
            suffix: 'shazam'
        })
            .then(results => {
                const dirRegex = new RegExp(testDir + '/'),
                    indexRegex = new RegExp(Config.ipfs.mainIndex + '$');
                results.forEach(r => {
                    if (
                        !(r.path).match(dirRegex)
                            ||
                        (r.path).match(indexRegex)
                    ) return;
                    expect((r.path).match(/shazam$/)).toBeTruthy();
                });
                done();
            })
            .catch(err => {done(err);});
    });

    it('Creates correct relative links', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(relLinkTest, testPass)
            .then(results => {
                const iRegex = new RegExp(Config.ipfs.mainIndex + '$');
                let items = [];
                    matched = [],
                    run = 0;
                results.forEach((item) => {
                    if (item.path.match(iRegex)) items.push(item);
                });
                items.forEach((item) => {
                    ipfs.get(item.hash)
                        .then(stream => {
                            run++;
                            stream.on('data', obj => {
                                checkRelLinks(item.path, obj.content, run,
                                    matched, done);}
                            );
                        })
                        .catch(err => {done(err);});
                 });
            })
            .catch(err => {done(err);});
    });

    it('Correctly includes hidden files', (done) => {
        const hiddenFile = 'ipfsecret/test/.wcryptpass.wcrypt',
            ipfsecret = new IPFSecret();
        ipfsecret.addIndexed(testDir, {
            passphrase: testPass,
            hidden: true
        })
            .then(results => {
                let found = false;
                results.forEach((item) => {
                    if (item.path === hiddenFile) found = true;
                });
                if (found) done();
                else done(new Error(Config.err.noHidden));
            })
            .catch(err => {done(err);});
    });

});
