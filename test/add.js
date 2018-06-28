const bs58 = require('bs58'),
    Config = require('../lib/config.json'),
    expect = require('expect'),
    ipfsAPI = require('ipfs-api'),
    ipfs = ipfsAPI(
        Config.ipfs.host,
        Config.ipfs.port,
        {protocol:Config.ipfs.proto}
    );
    IPFSecret = require('../index.js');

process.env.IPFSECRET_ENV = 'test';

function checkEntryFormat(result, done) {
    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('hash');
    expect(result).toHaveProperty('size');
    done();
}

function confirmEncrypt(chunkNum, stream, done) {
    stream.on('error', err => {
        done(err);
    });
    stream.on('data', chunk => {
        chunkNum ++;
        if (chunkNum === 1) {
            const header = chunk.slice(0,31).toString('utf8'),
                begin = header.substring(0,6);
            if (begin === 'WCRYPT')
                done();
            else
                done(new Error(Config.err.noEncrypt));
        }
    });
}

function confirmEncryptStream(stream, done) {
    let chunkNum = 0;
    stream.on('data', obj => {
        if (obj.content) {
            confirmEncrypt(chunkNum, obj.content, done);
        }
        else {
            done(new Error(Config.err.objEmpty));
        }
    });
}

describe('ipfsecret.add', () => {
    const testPass = '学年別漢字配当表',
        testDir = './test',
        testFile = './README.md';

    it('Throws error with no passphrase', (done) => {
        const ipfsecret = new IPFSecret();
        try {
            ipfsecret.add(testFile);
            done(Config.err.noErr);
        }
        catch(err) {
            done();
        }
    });

    it('Returns expected object format', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testFile, testPass)
            .then(results => {
                checkEntryFormat(results[0], done);
            })
            .catch(err => {
                done(err);
            });
    });

    it('Returns encrypted data', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testFile, testPass)
            .then(result => {
                const hash = result[0].hash;
                ipfs.files.get(hash)
                    .then(stream => {
                        confirmEncryptStream(stream, done);
                    })
                    .catch(err => {
                        done(err);
                    });
            })
            .catch(err => {
                done(err);
            });
    });

    it('Accepts a directory', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testDir, testPass)
            .then(results => {
                expect(results.length).toEqual(6);
                done();
            })
            .catch(err => {
                done(err);
            });
    });

    it('Detects passphrase inside Wcrypt options', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testFile, {
            wcrypt: {
                material: {
                    passphrase: testPass
                }
            }
        })
            .then(results => {
                expect(results.length).toEqual(1);
                done();
            })
            .catch(err => {
                done(err);
            });
    });

    it('Detects passphrase outside Wcrypt options', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testFile, {passphrase: testPass})
            .then(results => {
                expect(results.length).toEqual(1);
                done();
            })
            .catch(err => {
                done(err);
            });
    });

    it('Accepts valid custom Wcrypt options', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testDir, {
            wcrypt: {
                config: {
                    crypto: { tagLength: 112 },
                    derive: {
                        hash: 'SHA-256',
                        length: 192,
                        iterations: 5000
                    }
                },
                material: {
                    passphrase: 'test123'
                }
            }})
            .then(results => {
                expect(results.length).toEqual(6);
                done();
            })
            .catch(err => {
                done(err);
            });
    });

    it('Rejects invalid custom Wcrypt options (file)', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testFile, {
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
                material: {
                    passphrase: 'test123'
                }
            }}
        )
            .then(results => {
                done(Config.err.noErr);
            })
            .catch(err => {
                done();
            });
    });

    it('Rejects non-string path', (done) => {
        const ipfsecret = new IPFSecret();
        try {
        ipfsecret.add([testDir], testPass)
            .then(hash => {
                done(Config.err.noErr);
            })
            .catch(err => {
                done(Config.err.noErr);
            });
        }
        catch(err) {
            done();
        }
    });

    it('Respects root option', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testDir, {passphrase: testPass, root: true})
            .then(hash => {
                hash = bs58.encode(hash);
                expect(hash.substring(0,2)).toEqual('Qm');
                expect(hash.length).toEqual(46);
                done();
            })
            .catch(err => {
                done(err);
            });
    });

    it('Respects directory name option', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testDir, {
            passphrase: testPass,
            directory: 'shazam'
        })
            .then(results => {
                results.forEach(r => {
                    expect((r.path).match(/^shazam/)).toBeTruthy();
                });
                done();
            })
            .catch(err => {
                done(err);
            });
    });

    it('Respects suffix option', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testDir, {
            passphrase: testPass,
            suffix: 'shazam'
        })
            .then(results => {
                const regex = new RegExp(testDir + '/');
                results.forEach(r => {
                    if (!(r.path).match(regex)) return;
                    expect((r.path).match(/shazam$/)).toBeTruthy();
                });
                done();
            })
            .catch(err => {
                done(err);
            });
    });

    it('Correctly includes hidden files', (done) => {
        const hiddenFile = 'ipfsecret/test/.wcryptpass.wcrypt',
            ipfsecret = new IPFSecret();
        ipfsecret.add(testDir, {
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
