const Config = require('../lib/config.json'),
    expect = require('expect'),
    ipfsAPI = require('ipfs-api'),
    ipfs = ipfsAPI(
        Config.ipfs.host,
        Config.ipfs.port,
        {protocol:Config.ipfs.proto}
    ),
    IPFSecret = require('../index.js'),
    Package = require('../package.json'),
    Wcrypt = require('webcrypto-crypt');
    
process.env.IPFSECRET_ENV = 'test';

describe('Version', () => {

    it('Equals package.json.version', (done) => {
        const ipfsecret = new IPFSecret();
        expect(ipfsecret.version).toEqual(Package.version);
        done();
    });

});

describe('Debug (child_process)', () => {

    it('Sends output to stderr', (done) => {
        const exec = require('child_process').exec,
            source = `node -e 'var IPFSecret = require (".");` +
                `IPFSecret.DEBUG=true;var i=` +
                `new IPFSecret();'`;
        exec(source, (error, stdout, stderr) => {
            if (stderr.match(/\[debug\] /))
                done();
            else
                done(new Error('No stderr output detected.'));
        });
    });

});
