const bs58 = require('bs58'),
    Config = require('../lib/config.json'),
    crypto = require('crypto'),
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
    ),
    IPFSecret = require('../index.js'),
    stream = require('stream'),
    sBuff = require('stream-buffers');
    
process.env.IPFSECRET_ENV = 'test';

function matchDecrypt(testFile, entry, done) {
    readFile(testFile)
        .then(data => {
            let a = crypto.createHash('sha256').update(data, 'utf8').digest(),
                b = crypto.createHash('sha256').update(entry.content, 'utf8').digest();
            expect(a).toEqual(b);
            done();
        })
        .catch(err => {
            done(err);
        });
}

function matchDecryptStream(testFile, obj, done) {
    const writeable = new sBuff.WritableStreamBuffer();
    writeable.on('finish', () => {
        const results = writeable.getContents();
        matchDecrypt(testFile, {
            path: path.basename(obj.path),
            content: results
        }, done);
    });
    obj.content.pipe(writeable);
    obj.content.on('error', (err) => {
        done(err);
    });
}

describe('ipfsecret.get', () => {
    const testPass = '学年別漢字配当表',
        testDir = './test',
        testFile = './README.md';

    it('Rejects numeric multihash', (done) => {
        const ipfsecret = new IPFSecret(),
            notAHash = new RegExp(Config.err.notAHash);
        try {
            ipfsecret.get(123, testPass)
                .then(s => {
                    done(new Error(Config.err.noErr));
                });
        }
        catch(err) {
            expect (err.message).toMatch(notAHash);
            done();
        }
    });

    it('Accepts multihash as buffer', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testFile, {passphrase: testPass, root: true})
            .then(hash => {
                ipfsecret.get(hash, testPass)
                    .then(s => {
                        expect(s instanceof stream.Stream).toBeTruthy();
                        done();
                    })
                    .catch(err => {
                        done(err);
                    });
            })
            .catch(err => {
                done(err);
            });
    });

    it('Accepts multihash as string', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testFile, {passphrase: testPass, root: true})
            .then(hash => {
                hash = bs58.encode(hash);
                ipfsecret.get(hash, testPass)
                    .then(s => {
                        expect(s instanceof stream.Stream).toBeTruthy();
                        done();
                    })
                    .catch(err => {
                        done(err);
                    });
            })
            .catch(err => {
                done(err);
            });
    });

    it('Returns a readable stream', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testDir, {passphrase: testPass, root: true})
            .then(hash => {
                ipfsecret.get(hash, testPass)
                    .then(s => {
                        expect(s instanceof stream.Stream).toBeTruthy();
                        done();
                    })
                    .catch(err => {
                        console.error(err);
                        done(err);
                    });
            })
            .catch(err => {
                done(err);
            });
    });

    it('Returns expected number of objects', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testDir, {passphrase: testPass, root: true})
            .then(hash => {
                ipfsecret.get(hash, testPass)
                    .then(stream => {
                        let objectCount = 0;
                        stream.on('data', obj => {
                            objectCount = objectCount + 1;
                        });
                        stream.on('end', () => {
                            expect(objectCount).toEqual(6);
                            done();
                        });
                    })
                    .catch(err => {
                        console.error(err);
                        done(err);
                    });
            })
            .catch(err => {
                done(err);
            });
    });

    it('Returns expected decrypted data', (done) => {
        const ipfsecret = new IPFSecret();
        ipfsecret.add(testFile, {
            passphrase: testPass,
            root: true}
        ).then(hash => {
            ipfsecret.get(hash, testPass).then(stream => {
                stream.on('data', obj => {
                    if (obj.content) {
                        matchDecryptStream(testFile, obj, done);
                    }
                });
            })
            .catch(err => {
                done(err);
            });
        })
        .catch(err => {
            done(err);
        });
    });

});
