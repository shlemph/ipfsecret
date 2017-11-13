#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"
'use strict';
const Config = require('../lib/config.json'),
    bs58 = require('bs58'),
    chop = require('chop'),
    fs = require('fs'),
    os = require('os'),
    homePassFile = os.homedir() + '/.wcryptpass',
    indexRegex = new RegExp(Config.ipfs.mainIndex + '$'),
    mkdirp = require('mkdirp'),
    passPath = process.env.WCRYPT_PASSFILE || homePassFile,
    path = require('path'),
    util = require('util'),
    fsStat = util.promisify(fs.stat),
    mkdir = util.promisify(mkdirp),
    readline = require('readline-sync'),
    readFile = util.promisify(fs.readFile),
    subdirRegex = new RegExp('Qm.{44}' + Config.ipfs.mainSubdir),
    yargs = require('yargs'),
    IPFSecret = require('../.'),
    prog = (path.basename(__filename).replace(/\.js$/,''));

if (!process.stdin.isTTY) {
    console.error(`Piping data to ${ prog } not currently supported.`);
    process.exit(0);
}
else {
    var includeHidden = false;
    const ipfsecret = getIPFSecretObject();
    const argv = getArgv(ipfsecret);
    handleMainYargs();
    if (yargs.argv.version) {
        process.stdout.write(IPFSecret.version + "\n");
        process.exit(0);
    }
    if (argv._.length < 1) {
        yargs.showHelp();
    }
    else {
        const arg = argv._[1], command = argv._[0];
        validateCommand(arg, command);
        exec(ipfsecret, arg, command);
    }
}

function add(ipfsecret, command, arg) {
    fsStat(arg)
        .then(stats => {
            checkAddSanity(command, arg, stats);
            encrypt(ipfsecret, arg);
        })
        .catch(err => {
            console.error(Config.err.noStat + err);
        });
}

function addToIPFS(ipfsecret, arg, passphrase) {
    return ipfsecret.add(arg, {
        hidden: includeHidden,
        indexed: yargs.argv.web,
        passphrase: passphrase,
        root: true
    })
}

function checkAddSanity(command, arg, stats) {
    if (stats.isDirectory() && !(yargs.argv.recursive)) {
        console.error(`Error: '${ arg }' is a directory, use` +
            ` '--recursive' to specify directories`);
        process.exit(0);
    }
    else if (stats.isFile() && yargs.argv.recursive) {
        console.error(`Error: '${ arg }' is a file, ` +
            `'--recursive' only valid for directories`);
        process.exit(0);
    }
    else if (yargs.argv.naked && yargs.argv.gateway) {
        console.error(`Error: '--naked' is ` +
            `invalid when used with '--gateway'`);
        process.exit(0);
    }
}

function checkPassFile(stats) {
    if (parseInt(stats.mode) === 33152) {
        return readFile(passPath)
            .then(data => {
                const passphrase = chop.chomp(data.toString('utf8'));
                if (!passphrase) throw new Error(Config.err.passReqd);
                return passphrase;
            })
            .catch(err => {handlePassErr(err);});
    }
    else {throw new Error(Config.err.filePerms);}
}

function debug(msg) {
    var msg = Array.prototype.slice.call(arguments);
    msg.unshift('[debug] ');
    msg = msg.join(' ');
    if (IPFSecret.DEBUG) console.error(msg);
}

function decrypt(ipfsecret, arg, passphrase) {
    ipfsecret.get(arg, passphrase)
        .then(stream => {getObjects(stream);})
        .catch(err => {console.error(err);});
}

function encrypt(ipfsecret, arg) {
    getPassphrase('encrypt')
        .then(passphrase => {
            addToIPFS(ipfsecret, arg, passphrase) 
            .then(hash => {outputResult(ipfsecret, hash);})
            .catch(err => {console.error(err);});
        })
        .catch(err => {console.error(err);});
}

function exec(ipfsecret, arg, command) {
    if (command === 'add') {
        if (yargs.argv.web) debug('Adding ' + arg + ' with web interface');
        else debug('Adding ' + arg);
        add(ipfsecret, command, arg);
    }
    else if (command === 'get') {
        debug('Retrieving ' + arg);
        get(ipfsecret, arg);
    }
}

function get(ipfsecret, arg) {
    getPassphrase('decrypt')
        .then(passphrase => {decrypt(ipfsecret, arg, passphrase);})
        .catch(err => {console.error(err);});
}

function getAddOptions() {
    return {
        web:       ['w', 'false', 'Add web interface'],
        naked:     ['n', 'false', 'With --web, return naked hash vs URL'],
        recursive: ['r', 'false', 'Add as directory, recursively'],
        hidden:    ['H', 'false', 'When adding directory, include hidden files'],
    };
}

function getAddArgs(yargs) {
    let options = getAddOptions(), keys = Object.keys(options);
    const argv = yargs.usage('Usage: $0 add [options] [file|dir]');
    keys.forEach(k => {
        let o = options[k];
        argv.option(k, {alias: o[0], default:o[1], describe:o[2],
            boolean: true});
    });
    argv.wrap(null).argv;
}

function getArgDescs() {
    return {
        add: 'Encrypt & add files to IPFS',
        api: 'Specify IPFS API configuration',
        debug: 'Print debugging info to stderr',
        gateway: 'Use this HTTP(S) gateway when returning gateway address',
        get: 'Retrieve & decrypt encrypted files from IPFS',
        list: 'List known HTTPS gateways',
        out: 'Path where output should be stored',
        route: '/ip4/' + Config.ipfs.host + '/tcp/' + Config.ipfs.port,
        ver: 'Display version and exit' 
    };
}

function getArgv(ipfsecret) {
    const desc = getArgDescs();
    const argv = yargs.usage('Usage: $0 <command> [options]')
        .strict()
        .command('get', desc.get, function (yargs) {
            const argv = yargs.usage('Usage: $0 get [multihash]')
                .option('output', {alias: 'o', describe: desc.out,
                    type: 'string'})
                .help('help').wrap(null).argv
        })
        .command('add', desc.add, function (yargs) {getAddArgs(yargs);})
        .command('list', desc.list, function (yargs) {
            let count = 0;
            function list(item) {console.log((count++) + ' - ' + item);}
            (ipfsecret.getGatewayList()).forEach(list);
            process.exit(0);
        })
        .option('debug',
            {alias: 'd', default: false, describe: desc.debug,
            boolean: true})
        .option('api',
            {alias: 'a', default: desc.route, describe: desc.api,
            type: 'string'})
        .option('gateway',
            {alias: 'g', default: false, describe: desc.gateway,
            type: 'string'})
        .option('version',
            {alias: 'v', default: false, describe: desc.ver,
            boolean: true})
        .implies('gateway', 'web')
        .implies('naked', 'web')
        .help('help')
        .wrap(null)
        .argv;
    return argv;
}

function getDefaultGateway(h) {
    const gPort = Config.ipfs.gatewayPort,
        host = Config.ipfs.host,
        idx = Config.ipfs.mainIndex,
        proto = Config.ipfs.proto,
        def = `${ proto }://${ host }:${gPort}/ipfs/${ h }/${ idx }`;
    return def;
}

function getIPFSecretObject() {
    let ipfsecret;
    if (yargs.argv.api) {
        const parts = (yargs.argv.api).split('/'),
            host = parts[2], port = parts[4];
        ipfsecret = new IPFSecret({host: host, port: port});
    }
    else ipfsecret = new IPFSecret();
    return ipfsecret;
}

function getMainOptions() {
    const t = `/ip4/${ Config.ipfs.host }/tcp/${ Config.ipfs.port }`;
    return {
        debug:   ['d', 'false', 'Print debugging info to stderr', true],
        api:     ['a', t,       'Specify IPFS API config', false, 'string'],
        version: ['v', 'false', 'Display version and exit', true]
    };
}

function getObjects(stream) {
    stream.on('data', (obj) => {
        if (
            (obj.content) &&
            !(obj.path.match(subdirRegex)) &&
            !(obj.path.match(indexRegex)) &&
            !(obj.path.match('mitm.html'))
        ) {
            obj.content.on('error', (err) => {
                console.error('Error: Could not decrypt ' + obj.path);
            });
            const hasPath = new RegExp(path.sep);
            if ((obj.path).match(hasPath)) handleDir(obj);
            else handleFile(obj);
        }
    });
}

function getPassphrase(mode) {
    return fsStat(passPath)
        .then(stats => {return checkPassFile(stats);})
        .catch(err => {
            if (err.code === 'ENOENT') {
                debug('No wcryptpass file found.');
                return getPassphraseFromPrompt(mode);
            }
            else if (err.message === Config.err.filePerms) {
                debug('wcryptpass file has insecure permissions.');
                return getPassphraseFromPrompt(mode);
            }
            else throw err;
        });
}

function getPassphraseFromPrompt(mode) {
    return new Promise ((resolve, reject) => {
        var passphrase = readline.question(Config.cmdline.passPrompt, {
            hideEchoBack: true, mask: ''
        });
        if (!passphrase)
          reject(new Error(Config.err.passReqd));
        else if (mode === 'encrypt') {
            var confirmPassphrase = readline.question(
            Config.cmdline.passConf, {hideEchoBack: true, mask: ''});
            if (confirmPassphrase !== passphrase)
                resolve(getPassphraseFromPrompt(mode));
            else resolve(passphrase.toString());
        }
        else resolve(passphrase.toString());
    });
}

function handleDir(obj) {
    const parsed = path.parse(obj.path),
        dirParts = (parsed.dir).split(path.sep),
        multihash = dirParts.shift(),
        lDir = yargs.argv.output || (prog + '-' +
            Config.ipfs.decryptedPrefix + '-' + multihash),
        relDir = lDir + path.sep + dirParts.join(path.sep),
        relative = relDir + path.sep + parsed.name + parsed.ext;

    mkdir(relDir)
        .then(() => {handleObj(relative, obj);})
        .catch(err => {throw err;});
}

function handleFile(obj) {
    const multihash = obj.path,
        lFile = yargs.argv.output || (prog + '-' +
            Config.ipfs.decryptedPrefix + '-' +
            multihash),
        writeable = fs.createWriteStream(lFile);
    obj.content.pipe(writeable);
    obj.content.on('finish', () => {
        debug('Retrieved ' + multihash);
    });
}

function handleObj(relative, obj) {
    if (obj.content) {
        const writeable = fs.createWriteStream(relative);
        obj.content.pipe(writeable);
        obj.content.on('finish', () => {
            debug('Retrieved ' + relative);
        });
    }
}

function handleMainYargs() {
    if (yargs.argv.hidden && !yargs.argv.recursive) {
        console.error('--hidden only valid when used with --recursive');
        process.exit(0);
    }
    if (yargs.argv.api) {
        var regex = new RegExp('^/ip4/.+/tcp/\\d+$');
        if (!(yargs.argv.api).match(regex)) {
            console.error('--api syntax is invalid');
            process.exit(0);
        }
    }
    if (yargs.argv.debug) IPFSecret.DEBUG = true;
    if (yargs.argv.hidden) includeHidden = true;
}

function handlePassErr(err) {
    if (err.code === 'ENOENT') {
        debug('No wcryptpass file found.');
        return getPassphraseFromPrompt(mode);
    }
    else if (err.message === Config.err.filePerms) {
        debug('wcryptpass file has insecure permissions.');
        return getPassphraseFromPrompt(mode);
    }
    else if (err.message === Config.err.passReqd) throw err;
    else throw err;
}

function outputResult(ipfsecret, hash) {
     if (yargs.argv.web) {
         if (yargs.argv.gateway) process.stdout.write(
             useGateway(ipfsecret, bs58.encode(hash)));
         else if (yargs.argv.web && yargs.argv.naked)
             process.stdout.write(bs58.encode(hash));
         else process.stdout.write(getDefaultGateway(bs58.encode(hash)));
     }
     else process.stdout.write(bs58.encode(hash));
}

function useGateway(ipfsecret, h) {
    const idx = Config.ipfs.mainIndex,
        list = ipfsecret.getGatewayList();
    if (list[parseInt(yargs.argv.gateway)])
        return `${ list[parseInt(yargs.argv.gateway)] }/ipfs/${ h }/${ idx }`;
    else
        return `${ yargs.argv.gateway }/ipfs/${ h }/${ idx }`;
}

function validateCommand(arg, command) {
    const known = {add: 1, get: 1, list: 1};
    if (!known[command]) {
        console.error("\nUnknown command.\n");
        yargs.showHelp();
        process.exit(0);
    }
    else if (!arg) {
        if (command === 'get') console.error('Multihash required');
        if (command === 'add') console.error('File or directory required');
        yargs.showHelp();
        process.exit(0);
    }
}
