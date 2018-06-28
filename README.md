[![npm](https://img.shields.io/npm/v/ipfsecret.svg)]() [![license](https://img.shields.io/github/license/c2fo-lab/ipfsecret.svg)]() [![npm](https://img.shields.io/npm/dw/ipfsecret.svg)]() [![node](https://img.shields.io/node/v/ipfsecret.svg)]() [![GitHub last commit](https://img.shields.io/github/last-commit/c2fo-lab/ipfsecret.svg)]()

  * [Introduction](#introduction)
  * [Install](#install)
  * [Quickstart](#quickstart)
  * [Warnings](#warnings)
  * [Testing](#testing)
  * [API](#api)
  * [Command-line web gateways](#command-line-web-gateways)
  * [Implementation](#implementation)
  * [Passphrase file](#passphrase-file)
  * [Security](#security)
  * [Troubleshooting](#troubleshooting)
  * [Acknowledgements](#acknowledgements)
  * [Todo](#todo)
  * [See also](#see-also)

# Introduction

IPFSecret lets you encrypt and decrypt IPFS files with a secret passphrase.

If you are new to IPFS, there are guides for [getting started](https://ipfs.io/docs/getting-started/) and [running the daemon with the right port](https://github.com/ipfs/js-ipfs-api#running-the-daemon-with-the-right-port).

# Install

    λ npm install -g ipfsecret

# Quickstart

## Add a file

    λ ipfsecret add README.md
    Passphrase?
    Confirm passphrase:
    QmeVMn7oLoSC7ShLeLPu2tMrGq4TEr9icSxPbKxAF7CJ7Q

## Get a file

    λ ipfsecret get QmeVMn7oLoSC7ShLeLPu2tMrGq4TEr9icSxPbKxAF7CJ7Q
    Passphrase?
    λ head -n1 ipfsecret-decrypted-QmeVMn7oLoSC7ShLeLPu2tMrGq4TEr9icSxPbKxAF7CJ7Q
    * [Introduction](#introduction)
    λ

## Add a directory

    λ ipfsecret add -r node_modules/webcrypto-crypt
    Passphrase?
    Confirm passphrase:
    QmfSi8rg7ismstGwDKoEwKySCr8Ptt7XHV1xMkB27DAARv

## Get a directory

    λ ipfsecret get QmfSi8rg7ismstGwDKoEwKySCr8Ptt7XHV1xMkB27DAARv
    Passphrase?
    λ ls ipfsecret-decrypted-QmfSi8rg7ismstGwDKoEwKySCr8Ptt7XHV1xMkB27DAARv/node_modules/webcrypto-crypt/
    CHANGES.md      README.md       bin             examples        lib             test
    LICENSE         SIGNED.txt      dist            index.js        package.json

## Add a file, include web interface

    λ ipfsecret add -w README.md
    Passphrase?
    Confirm passphrase:
    http://127.0.0.1:8080/ipfs/QmNndRMk9sQzYGmszosGCYUiDm9WBKGy512bLZNoxcAcPm/ipfsecret.html

## Add a directory, include web interface

    λ ipfsecret add -wr node_modules/webcrypto-crypt
    Passphrase?
    Confirm passphrase:
    http://127.0.0.1:8080/ipfs/QmWCGgmQdT1xNd44kUwEqY61aX551kRMwrXdvBPBGA1Qto/ipfsecret.html

# Warnings

* File contents added via IPFSecret are encrypted but file and directory names are stored in clear text.
* There are [problems with symmetric algorithms](http://web.archive.org/web/20150916184759/http://www.informit.com/articles/article.aspx?p=102212).
* Depending on [pinning](https://discuss.ipfs.io/t/replication-on-ipfs-or-the-backing-up-content-model/372/2) activity, your encrypted data could be distributed to many nodes across the IPFS network.
* Entities with access to your IPFSecret multihashes that then guess, learn, or crack the relevant passphrase will be able to decrypt your data.
* Unknown bugs in this code or its dependency tree (e.g., the [webcrypto-crypt](https://c2fo-lab.github.io/webcrypto-crypt) package) could render encryption ineffective.
* Downloading large files over IPFS web gateways can be slow and in the case of decryption there is currently no feedback on download progress.
* [Private Networks](https://github.com/ipfs/go-ipfs/blob/master/docs/experimental-features.md#private-networks), [public-key cryptography](https://en.wikipedia.org/wiki/Public-key_cryptography) tools, or something like [Decentralized Could](https://decentralized.cloud/) or [Firefox Send](https://send.firefox.com/) may better fit your needs.

# Testing

## Node.js

Optionally run the relevant daemon using the [```--offline```](https://github.com/ipfs/go-ipfs/pull/2696#issuecomment-242664950) option for the duration of the tests.  Tests assume the API settings present in [```lib/config.js```](https://github.com/c2fo-lab/ipfsecret/blob/master/lib/config.json#L56-L60).

    λ npm run test

## Web browsers

As part of the install process, IPFSecret adds a multihash for browser testing and extracts it to ```.examples/```. The password will be ```justtesting``` and you can access it over the local web gateway using the same multihash.

## Tested environments

| **OS** | **Environment** | **Version** |
| :-------- | :------- | :------- |
| Mac Sierra | Chrome  | 67  |
| Mac Sierra | Firefox  | 60  |
| Mac Sierra | Node  | 8.11.3 |
| Mac Sierra | Safari | 11.0 |

### Help

#### Commands

    λ ipfsecret --help
    Usage: ipfsecret <command> [options]

    Commands:
      get   Retrieve & decrypt encrypted files from IPFS
      add   Encrypt & add files to IPFS
      list  List known HTTPS gateways

    Options:
      --debug, -d    Print debugging info to stderr  [boolean] [default: false]
      --api, -a      Specify IPFS API configuration  [string] [default: "/ip4/127.0.0.1/tcp/5001"]
      --gateway, -g  Use this HTTP(S) gateway when returning gateway address  [string] [default: false]
      --version, -v  Display version and exit  [boolean] [default: false]
      --help         Show help  [boolean]

##### add

    λ ipfsecret add -h
    File or directory required
    Usage: ipfsecret add [options] [file|dir]

    Options:
      --debug, -d      Print debugging info to stderr  [boolean] [default: false]
      --api, -a        Specify IPFS API configuration  [string] [default: "/ip4/127.0.0.1/tcp/5001"]
      --gateway, -g    Use this HTTP(S) gateway when returning gateway address  [string] [default: false]
      --version, -v    Display version and exit  [boolean] [default: false]
      --help           Show help  [boolean]
      --web, -w        Add web interface  [boolean] [default: "false"]
      --naked, -n      With --web, return naked hash vs URL  [boolean] [default: "false"] 
      --recursive, -r  Add as directory, recursively  [boolean] [default: "false"]
      --hidden, -H     When adding directory, include hidden files  [boolean] [default: "false"]

##### get

    λ ipfsecret get --help
    Multihash required
    Usage: ipfsecret get [multihash]

    Options:
      --debug, -d    Print debugging info to stderr  [boolean] [default: false]
      --api, -a      Specify IPFS API configuration  [string] [default: "/ip4/127.0.0.1/tcp/5001"]
      --gateway, -g  Use this HTTP(S) gateway when returning gateway address  [string] [default: false]
      --version, -v  Display version and exit  [boolean] [default: false]
      --help         Show help  [boolean]
      --output, -o   Path where output should be stored  [string]

#### example of specifying output paths

    λ ipfsecret get -o decrypted.md QmXCsAFuP7Jv2bePvcZEmHeygSHLYfVEB9rtkvhaKF5pL9
    Passphrase?
    λ head -n1 decrypted.md
    * [Purpose](#purpose)

    λ ipfsecret get -o decrypted-dir-test QmfSi8rg7ismstGwDKoEwKySCr8Ptt7XHV1xMkB27DAARv
    Passphrase?
    λ ls decrypted-dir-test/node_modules/webcrypto-crypt/
    CHANGES.md      README.md       bin             examples        lib             test
    LICENSE         SIGNED.txt      dist            index.js        package.json

# API

Please assume the following lines precede these examples:

```javascript
const IPFSecret = require('ipfsecret'),
    ipfsecret = new IPFSecret();
```

## ipfsecret.add(path, passphrase)

Wraps [ipfs.files.add](https://github.com/ipfs/interface-ipfs-core/tree/master/API/files) to require a ```path``` to add to IPFS and a ```passphrase``` for encryption.  Encrypts each file found along the path using [webcrypto-crypt](https://c2fo-lab.github.io/webcrypto-crypt) and appends the ```.wcrypt``` suffix before adding.

### Add file

```javascript
ipfsecret.add('./README.md', 'justtesting')
    .then(results => {
        console.log(results);
    })
    .catch(err => {
        console.error(err);
    });
```

Example:

    [ { path: 'README.md.wcrypt',
      hash: 'QmcrMFv4f4yef5EpdM9mUTGiE4msi2VKLmTPbGenRaiKLd',
      size: 20871 } ]

### Add directory

```javascript
ipfsecret.add('./test', 'justtesting')
    .then(results => {
        console.log(results);
    })
    .catch(err => {
        console.error(err);
    });
```

Example:

    [ { path: 'ipfsecret/test/add-indexed.js.wcrypt',
        hash: 'QmPm5MGHooEiDuiJjDg5dFRvaNgyTNYuM7Lx4gqj5k77cB',
        size: 8013 },
      { path: 'ipfsecret/test/add.js.wcrypt',
        hash: 'Qmcdj2aRshwSkVnEUSAANcHEmbyjb1tnt9Cg5Ubh2bxvav',
        size: 6900 },
      { path: 'ipfsecret/test/get.js.wcrypt',
        hash: 'QmXYeFbCBL8vgYKsvy4K98kYNvqDHMXVeEogR6zQzdedg7',
        size: 5322 }...

0 byte files are skipped during encryption.  Symbolic links encountered are resolved and encrypted as separate files.

### Other options

If the caller passes in an Object instead of ```passphrase```, ```ipfsecret.add``` recognizes the following key:value pairs:

```javascript
  const options = {
      directory: 'mydirname',                 // Use this wrapping dir, default 'ipfsecret'
      hidden: false,                          // Include hidden files.  Default true
      passphrase: 'justtesting',              // Use value to encrypt, always required
      root: true,                             // Return just multihash.  Default false
      suffix: 'myfilesuffix',                 // Use this suffix, default 'wcrypt'
      wcrypt: {config:{crypto:tagLength:112}} // Pass options to webcrypto-crypt (see below)
  };
```

#### Root multihash only

The multihash is returned as a [Buffer](https://nodejs.org/api/buffer.html):

```javascript
const bs58 = require('bs58');

ipfsecret.add('./test', {passphrase:'justtesting', root:true})
    .then(hash => {
        console.log(bs58.encode(hash));
    })
    .catch(err => {
        console.error(err);
    });
```

Example:

    Qmf22oxRTsz6CPWf2xDZeF729xdBx7ULDQsdtqpXYh8UKV

#### Custom file suffix

```javascript
ipfsecret.add('./test', {passphrase:'justtesting', suffix: 'shazam'})
    .then(results => {
        console.log(results);
    })
    .catch(err => {
        console.error(err);
    });
```

Example:

    [ { path: 'ipfsecret/test/add-indexed.js.shazam',
        hash: 'QmY4EWxfvBVAUVzpbB7wXhktWLFwE4xunx1jiFbpiNWiKM',
        size: 8013 },
      { path: 'ipfsecret/test/add.js.shazam',
        hash: 'QmRGKq3VHsuX4kyerYE1atNBC7wCu2gRpmxXqocKdXTQsT',
        size: 6900 },
      { path: 'ipfsecret/test/get.js.shazam',
        hash: 'QmRU2qKJBScmedhcDgGGPCvtpWVnasQEJdkF9UvVEM9L7N',
        size: 5322 },...
    
#### Custom wrapping dir

```javascript
ipfsecret.add('./test', {passphrase:'justtesting', directory:'shazam'})
    .then(results => {
        console.log(results);
    })
    .catch(err => {
        console.error(err);
    });
```

Example:

    [ { path: 'shazam/test/add-indexed.js.wcrypt',
        hash: 'QmTWSp9uyPG2DuxFuw3XBhuqJd7cq4zemz4iJqxMw6693r',
        size: 8013 },
      { path: 'shazam/test/add.js.wcrypt',
        hash: 'QmXC348Z6PZGUCSz4tMGaRuhcQ7cgiAxhD8h4gbqhCoAEn',
        size: 6900 },
      { path: 'shazam/test/get.js.wcrypt',
        hash: 'QmcU8eu2fWFfUsM1SkKq8zSrmDa9hWB6hze6yVzNtDKE2G',
        size: 5322 }...

#### Custom cryptography settings

To pass custom settings to [webcrypto-crypt](https://c2fo-lab.github.io/webcrypto-crypt), use the ```wcrypt``` options attribute:

```javascript
ipfsecret.add('./test', {
    passphrase:'justtesting',
    root: true,
    wcrypt: {
        config: {
            crypto: {
                tagLength: 112
            },
            derive: {
                hash: 'SHA-256',
                length: 192,
                iterations: 5000
            },
            paranoid: true
        }
    }
})
    .then(hash => {
        console.log(hash);
    })
    .catch(err => {
        console.error(err);
    });
```

    QmesGPZmiAgGhQSvEF7m7AdotmMygaPsJHvUH9STRjttwB
    λ head -n1 QmesGPZmiAgGhQSvEF7m7AdotmMygaPsJHvUH9STRjttwB/test/add-index.js.wcrypt
    WCRYPT00.01.125000112192SHA-256....

## ipfsecret.get(hash, passphrase)

Wraps [ipfs.files.get](https://github.com/ipfs/interface-ipfs-core/tree/master/API/files) to require a multihash for retrieval and a ```passphrase``` for decryption.  If ```passphrase``` is accepted, returns a promise that resolves to an object stream of decrypted file objects.

Any files encountered during an ```ipfsecret.get``` operation that could not be decrypted will not be retrieved.

Consider the following IPFS directory, encrypted with the passphrase, "学年別漢字配当表":

    λ ipfs ls QmZdNHJpzvTYqS3ba6EW4tryGaaEjHYyqY4ji6jZGK6Les/assets/fonts
    QmX6KnVkx6L3uXsLcTfi5d8SUwc4F1DLTEMeYgeRWYscoc 34016 roboto-v16-latin-300.woff.wcrypt
    QmYWKumL3aj54gRyG11dLRKp9eon9kCZzDM4MDMdzg7nQg 26475 roboto-v16-latin-300.woff2.wcrypt
    QmXAVPjgS2FiCpGXz7pA5Prh5WjHJtan1H1L7PSNNZLMCz 37008 roboto-v16-latin-300italic.woff.wcrypt
    QmaX7JAakBrgw5GAaMSuqxGyyntQsmxHc3jHLDDuuMsxSt 29439 roboto-v16-latin-300italic.woff2.wcrypt
    QmPPoCqdCCxNEqyPJmsEqasDUes9uP49UAzyJ6S4JVEnJb 34001 roboto-v16-latin-700.woff.wcrypt
    QmeFr49dWjcRJm9LM6vzfVEHZaZB8JwbgA5fXkq68vL4gn 26494 roboto-v16-latin-700.woff2.wcrypt
    QmSsuY2teXgFRk5dXx4P2CBe4VG4QmmjJsAXVMRofpKmvP 35974 roboto-v16-latin-700italic.woff.wcrypt
    Qmb3LegLP2kNLmvjUPsWkt82mVPX9BVGCbgTajj5KidrRG 28344 roboto-v16-latin-700italic.woff2.wcrypt
    QmU5ehUCXbbMcoEDHgdp55T51kqi1X1Qjh3VeeZAz94xdN 33648 roboto-v16-latin-regular.woff.wcrypt
    QmUWp3DJNujDFXvQaxdR8qm3ueYnGd6tnnsHuVP4qmiQVL 26516 roboto-v16-latin-regular.woff2.wcrypt
    λ

```javascript
const fs = require('fs'),
    path = require('path'),
    hash = 'QmZdNHJpzvTYqS3ba6EW4tryGaaEjHYyqY4ji6jZGK6Les';

ipfsecret.get(hash, '学年別漢字配当表')
    .then((stream) => {stream.on('data', (obj) => {
        if (obj.content) {
            var filename = path.basename(obj.path),
                writeable = fs.createWriteStream(filename);
            obj.content.pipe(writeable);
            obj.content.on('finish', () => {
                console.log('Wrote ' + filename);
            });
            obj.content.on('error', (err) => {
                console.error('Error: ' + err);
            });
        }
    });})
    .catch(err => {
        console.error(err);
    });
```

Example:

    Wrote roboto-v16-latin-300.woff
    Wrote roboto-v16-latin-300.woff2
    Wrote roboto-v16-latin-300italic.woff
    Wrote roboto-v16-latin-300italic.woff2
    Wrote roboto-v16-latin-700.woff
    Wrote roboto-v16-latin-700.woff2
    Wrote roboto-v16-latin-700italic.woff
    Wrote roboto-v16-latin-700italic.woff2
    Wrote roboto-v16-latin-regular.woff
    Wrote roboto-v16-latin-regular.woff2
    λ ls roboto-v16-latin-*
    roboto-v16-latin-300.woff               roboto-v16-latin-300italic.woff         roboto-v16-latin-700.woff               roboto-v16-latin-700italic.woff         roboto-v16-latin-regular.woff
    roboto-v16-latin-300.woff2              roboto-v16-latin-300italic.woff2        roboto-v16-latin-700.woff2              roboto-v16-latin-700italic.woff2        roboto-v16-latin-regular.woff2
    λ file roboto-v16-latin-300.woff
    roboto-v16-latin-300.woff: Web Open Font Format, flavor 65536, length 18972, version 1.1

### Other options

If the caller passes in an Object instead of a passphrase, ```ipfsecret.get``` recognizes the following key:value pairs:

```javascript
const options = {
    passphrase: 'justtesting',               // Use value to encrypt data, always required
    wcrypt: {config:{crypto:tagLength:112}} // Pass options to cryptography package
};
```

## ipfsecret.addIndexed(path, passphrase)

Otherwise identical to ```ipfsecret.add```, ```ipfsecret.addIndexed``` adds HTML, JavaScript, CSS, and fonts that together provide a browser interface for listing and decrypting ipfsecret-encrypted files.  This is an alias for ```ipfsecret.add(path, {passphrase: p, indexed: true}```.

### Add directory and include browser interface files

```javascript
ipfsecret.addIndexed('./test', 'justtesting')
    .then(results => {
        console.log(results);
    })
    .catch(err => {
        console.error(err);
    });
```

Example:

    [ { path: 'ipfsecret/ipfsecret/styles/normalize.css',
        hash: 'QmbfTL2ZsgZzhH5Cz6pcnChUkrDsozHnjnqSfYAbCex7W2',
        size: 7730 },
      { path: 'ipfsecret/ipfsecret/styles/fonts.css',
        hash: 'Qmc8XfJ4w1LjV6uK4q2ENzREdTELLpnGWdoKfnjkXHH1Vm',
        size: 1992 },
      { path: 'ipfsecret/ipfsecret/styles/milligram.css',
        hash: 'QmaFP6KqC1LrkBadFcxgqSKnxqhjByiALpjSeAoYtzMDth',
        size: 8729 },
      { path: 'ipfsecret/ipfsecret/js/ipfsecret.js',
        hash: 'QmTWa8Hx5G5M72xb3A3bbdmkvvpSM8UZ5ct8oqLZSgRfYn',
        size: 76326 },
      { path: 'ipfsecret/ipfsecret/fonts/roboto-v16-latin-300.woff',
        hash: 'QmVeWJjZaoXLitapfpDHVWxm7BwqqiT6FfeVdDHxMCkCXn',
        size: 18986 },
      { path: 'ipfsecret/ipfsecret/fonts/roboto-v16-latin-300.woff2',
        hash: 'QmNuucbg8ojSkDvN2x4HJBjiLqN9vdcKz5VPee6RroASgX',
        size: 14707 },
      ...

### Other options

#### Content overrides

In addition to all the options supported by ```ipfsecret.add```, you may override ```ipfsecret.addIndexed```'s CSS, font directory, and JavaScript build by passing in overriding options:

```javascript
ipfsecret.addIndexed('./test', {
    baseCss: './myBase.css',
    dialogCss: './myDialog.css',
    fontCss: './myFonts.css',
    mainCss: './myStyles.css',
    mapCss: './myStyles.css.map',
    fontsDir: './myFontsDirectory',
    jsPath: './myJavaScriptBuild.js',
    passphrase: 'justtesting',
})
    .then(results => {
        console.log(results);
    })
    .catch(err => {
        console.error(err);
    });
```

## ipfsecret.getGatewayList()

Return an array of currently known HTTP/S gateways; used by the command-line utility.

```javascript
console.log(ipfsecret.getGatewayList());
```

    [ 'https://gateway.ipfs.io',
      'https://earth.i.ipfs.io',
      'https://mercury.i.ipfs.io',
      'https://gateway.ipfsstore.it:8443',
      'https://scrappy.i.ipfs.io',
      'https://chappy.i.ipfs.io' ]

## IPFSecret.DEBUG = true | false

If set to ```true```, send debugging statements to stderr.  Default ```false```.

## IPFSecret.version

Returns the current version of this library, e.g., ```0.1.2```.

## Custom API endpoint

When instantiating a new IPFSecret object, you may optionally pass in ```options``` to override the default IPFS connection parameters:

```javascript
    const ipfsecret = new IPFSecret({
        host: '192.168.1.233',  // default 'localhost'
        port: 5002,             // default 5001
        proto: 'http'           // default 'http'
    });
```

# Command-line web gateways

## List known web gateways

    λ ipfsecret list
    0 - https://gateway.ipfs.io
    1 - https://earth.i.ipfs.io
    2 - https://mercury.i.ipfs.io
    3 - https://gateway.ipfsstore.it:8443
    4 - https://scrappy.i.ipfs.io
    5 - https://chappy.i.ipfs.io

## Specify a web gateway (instead of localhost) when outputting result

    λ ipfsecret add -g3 -wr node_modules/webcrypto-crypt/
    Passphrase?
    Confirm passphrase:
    https://gateway.ipfsstore.it:8443/ipfs/QmWqwUpf4jBdTb8BRxaLUvPQj3JMUtMQe1Kxo2sm3noHE7/ipfsecret.html

## Specify a custom gateway when outputting hash

    λ ipfsecret add -g "https://mygateway.io:8088" -wr node_modules/webcrypto-crypt/
    Passphrase?
    Confirm passphrase:
    https://mygateway.io:8088/ipfs/QmYYoHfaAcvkRQy6bubTChkXPi2c9d1r6vBatWeRXMr7p5/ipfsecret.htmlλ

# Implementation

## Cryptography

IPFSecret's encryption depends on WebCrypto's [SubtleCrypto](https://www.w3.org/TR/WebCryptoAPI/#subtlecrypto-interface) interface, specifically the algorithms [PBKDF2](https://www.w3.org/TR/WebCryptoAPI/#pbkdf2) and [AES-GCM](https://www.w3.org/TR/WebCryptoAPI/#aes-gcm). It then marshals the encrypted chunks into IPFS objects and adds these to IPFS as new files.  Decryption is carried out via the same SubtleCrypto interface, with the caller supplying the correct passphrase along with the relevant multihash to decrypt the files as they are retrieved.  See [webcrypto-crypt](https://c2fo-lab.github.io/webcrypto-crypt) for more information.

Decrypting IPFS files in the web browser is currently supported but encrypting in the browser is not supported.

## Web browsers

### HTML page

<p align="center">
  <a href="http://pix.toile-libre.org/upload/original/1510603116.png"><img width="50%" height="50%" src="http://pix.toile-libre.org/upload/original/1510603116.png"></a>
</p>

By default, IPFSecret publishes the index using the filename ```ipfsecret.html```.  This can be overridden to specify any filename but be aware ```index.html``` [has special meaning](https://github.com/ipfs/ipfs/issues/167#issuecomment-329969289) for IPFS gateways.

### Markup and styling

When calling ```addIndexed()``` from JavaScript or specifying the ```--web``` argument to the ```ipfsecret``` command-line utility, IPFSecret will generate unencrypted HTML pages that contain a directory listing and buttons to decrypt any file by providing the passphrase.  The HTML is currently styled using [Milligram](http://milligram.io/) but as noted in the [Content overrides](#content-overrides) section, you may also specify your own CSS and accompanying fonts.

### Decryption

IPFSecret currently accesses encrypted IPFS files from the web browser as [Blobs](https://developer.mozilla.org/en-US/docs/Web/API/Blob) and decrypts them via [webcrypto-crypt](https://c2fo-lab.github.io/webcrypto-crypt).

### Decrypted file size limits

[Filesaver.js documentation](https://github.com/eligrey/FileSaver.js/#supported-browsers) shows the download size limits of the various browsers.  If IPFSecret detects that an encrypted file is larger than the current browser's limit, instead of decrypting it will display a message suggesting other options.  Encrypted files can always be downloaded from the gateway and later decrypted using Node.js or the command-line.

### Encrypted file modified times

The ```Date modified``` field populated in the web interface reflects the modified time of the original, unencrypted file, versus the time that the encrypted version was created.

### Long download times & decryption times

IPFSecret currently relies on the browser's [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to access files as blobs, and there is currently no support in the API for showing download progress.  In the case of accessing large files over slow IPFS web gateways, you may end up waiting a good while for the encrypted file to download before decryption can begin, without knowing how much longer the download will take to complete.  Decryption in the browser can also be slow, particularly with blobs approaching 500MB or more.  There is currently a [Todo](#todo) item to migrate these operations to the [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API) which may improve performance in future releases.

### Offline mode

IPFSecret web pages try to detect whether or not the current browser is connected to the internet and, if not connected, attempt to redirect to the local IPFS HTTP gateway.  Decryption should work in the browser whether or not the user is connected to the internet, provided the multihashes in question are locally accessible.

# Passphrase file

See [.wcryptpass](https://c2fo-lab.github.io/webcrypto-crypt#wcryptpass)

# Security

Security Mail: labs@c2fo.com<br>
PGP key fingerprint: [````E838 B51C C63F 7ED6 0980 9535 4D46 5218 A674 6F81````](https://pgp.mit.edu/pks/lookup?search=0xE838B51CC63F7ED6098095354D465218A6746F81)<br>
Keyserver: [pgp.mit.edu](https://pgp.mit.edu)<br>

# Troubleshooting

IPFSecret is not fast.  For large directories and files, you may just need to wait it out...

    λ osxinfo
    User      : alfonz
    Time:     : Sun Nov 12 13:54:49 2017
    Model     : MacBookPro10,1
    Processor : Intel(R) Core(TM) i7-3615QM CPU @ 2.30GHz
    OS        : Darwin
    Release   : 16.7.0
    Disk      : 80.10% of 249.78 GB
    Memory    : 10254 MB of 17180 MB
    Shell     : /bin/bash
    Terminal  : screen
    Memory    : 10254 MB of 17180 MB
    Graphics  : Intel HD Graphics 4000 @ 1536 MB
    Graphics  : NVIDIA GeForce GT 650M @ 1024 MB
    Packages  : no packages found
    Uptime    : 1 day 04:37

    λ ipfs --version
    ipfs version 0.4.11

    λ ipfs init
    ...

    λ ipfs daemon --offline &
    [1] 12178
    λ Initializing daemon...
    Swarm not listening, running in offline mode.
    API server listening on /ip4/127.0.0.1/tcp/5001
    Gateway (readonly) server listening on /ip4/127.0.0.1/tcp/8080
    Daemon is ready

    λ git log | head -n4 && du -sh
    commit bebc6082da0a9f5d47a1ea2edc099bf671058bd4
    Author: Linus Torvalds <torvalds@linux-foundation.org>
    Date:   Sun Nov 12 10:46:13 2017 -0800

    2.9G    .

    λ time ipfsecret add -wrH .
    Passphrase?
    Confirm passphrase:
    http://127.0.0.1:8080/ipfs/QmdScWuXY97CDsqUpxCgF6RjtYnu8qzf66EaWpTdZNfvdN/ipfsecret.html
    real    4m32.701s
    user    3m53.192s
    sys     0m20.093s
    λ

    λ cd ..
    λ time ipfsecret -o decrypted-linux get QmdScWuXY97CDsqUpxCgF6RjtYnu8qzf66EaWpTdZNfvdN
    Passphrase?

    real    3m27.587s
    user    7m20.771s
    sys     0m29.577s

    λ du -sh decrypted-linux
    2.9G    decrypted-linux

    λ diff -Nur ./decrypted-linux ./linux
    λ # but some 0 byte files and empty dirs will cause differences (diff -r)

    λ ls -lh ubuntu.vdi
    -rw-------  1 alfonz  staff   2.7G Jul 27 19:06 ubuntu.vdi

    λ time ipfsecret add ubuntu.vdi
    Passphrase?
    Confirm passphrase:
    Qmd4tq3Q7PVzNcfDojdx7koRsEfVMnitvAFSR4EDhirUUj
    real    0m47.569s
    user    0m27.784s
    sys     0m6.920s

    λ time ipfsecret get -o ubuntu.vdi.decrypted Qmd4tq3Q7PVzNcfDojdx7koRsEfVMnitvAFSR4EDhirUUj
    Passphrase?

    real    2m10.282s
    user    2m4.236s
    sys     0m10.424s

    λ diff ubuntu.vdi.decrypted ubuntu.vdi
    λ

## Timeouts

You may encounter timeouts after connecting to the API server.  In these cases you can try adding the content again:

    λ ipfsecret add -wr linux/
    Passphrase?
    Confirm passphrase:
    { Error: connect ETIMEDOUT 127.0.0.1:5001
        at Object._errnoException (util.js:1041:11)
        at _exceptionWithHostPort (util.js:1064:20)
        at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1153:14)
      code: 'ETIMEDOUT',
      errno: 'ETIMEDOUT',
      syscall: 'connect',
      address: '127.0.0.1',
      port: 5001 }
    λ ipfsecret add -wr linux/
    Passphrase?
    Confirm passphrase:
    http://localhost:8080/ipfs/Qma7w6RchCgv7E8yqeqeU9viPE97RGMuih8yvE2NL4555q/ipfsecret.htmlλ

## File signature warnings

When decrypting directories that contain the web user interface, the unencrypted web interface files may trigger this warning:

    Error: Error: Invalid file signature webcrypto-crypt0.1.15

## Invalid index entries

Directories that contained no files or contained only 0-byte files will currently result in invalid links in the HTML indices.

## Out of memory

If you hand ```ipfsecret add``` a very large directory, you may encounter a fatal error like:

    FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory

In these cases you might consider writing several directories as separate operations.

# Acknowledgements

* Decryption via WebCrypto in the browser uses a modified version of the [binary-split](https://github.com/maxogden/binary-split) function.
* Modal box implementation from [modalbox](https://github.com/CristianDeveloper/modalbox).

# Todo

* Add automated tests for browser-based decryption.
* Fix UI navigation when user specifies ```.``` or ```../../../```, etc .
* Start ```ipfs --daemon``` if it's not already running for duration of tests.
* Support embed and decrypt Base64 and hexadecimal encoded data in HTML files.
* Support streaming decryption through the forthcoming [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API).
* Rewrite install.sh in node for portability
* Test on Win and Linux.
* Support [progress bar on the command line](https://github.com/ipfs/js-ipfs/pull/1036).

# See also

* [IPFS](https://ipfs.io/)
* [webcrypto-crypt](https://c2fo-lab.github.io/webcrypto-crypt)
