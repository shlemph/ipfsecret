'use strict';
const BlobToBuffer = require('blob-to-buffer'),
    { detect } = require('detect-browser'),
    browser = detect(),
    Config = require('../../lib/config.json'),
    isOnline = require('is-online'),
    toArrayBuffer = require('to-arraybuffer'),
    FileSaver = require('file-saver'),
    Path = require('path'),
    Wcrypt = require('webcrypto-crypt'),
    matcher = Buffer.from(Wcrypt.delimiter);

document.addEventListener("DOMContentLoaded", function(event) {

    const blobSupport = {
        firefox: {minVer: 20, maxSize: 800*1024*1024},
        chrome: {minvVer: 1, maxSize: 500*1024*1024},
        safari: {minVer: 10.1, maxSize: 100*1000*1024*1024},
        opera: {minVer: 15, maxSize: 500*1024*1024}
    };

    const byId = document.getElementById.bind(document),
        close = byId('close-modal'),
        content = byId('modal-box'),
        duration = '0.5s',
        open = byId('open-modal'),
        p = (location.pathname).split('/'),
        prefix = p.slice(0, p.length - 1).join('/') + '/',
        hash = p[2],
        opener = "open-modal-animation",
        modal = byId('mymodal');

    close.onclick = () => {modal.style.display = 'none';}
    window.onclick = (e) => {if (e.target==modal) modal.style.display="none";};

    function checkBlob(size) {
        let broken;
        switch (browser && browser.name) {
            case 'chrome':
            case 'firefox':
            case 'opera':
            case 'safari':
                if (
                    // unsupported browser version
                    (parseFloat(browser.version)
                            <
                     parseFloat(blobSupport[browser.name].minVer))
                        ||
                    // unsupported blob size for this browser
                    (size > parseInt(blobSupport[browser.name].maxSize))
                ) 
                {
                    broken = true;
                    alert(Config.ipfs.ui.browserDecryptNotSupported);
                }
                break;
            default:
                broken = false;
        };
        return broken;
    }

    function checkOnlineStatus() {
        isOnline().then(online => {
            if (!online && ((location.hostname !== 'localhost') &&
                (location.hostname !== '127.0.0.1'))) {
                const href = `${ Config.ipfs.proto }://` +
                    `${ Config.ipfs.host }:${ Config.ipfs.gatewayPort }` +
                    `${ location.pathname }`;
                 byId('footer-link').setAttribute('href', href);
                 byId('footer-link').innerHTML = (Config.ipfs.ui.offlineMode);

            }
        });
    }
    checkOnlineStatus();
    setInterval(checkOnlineStatus, parseInt(Config.ipfs.ui
       .offlineMonitorInterval));

    function download() {
        const filename = decodeURI(byId('filename').getAttribute('value')),
            size = parseInt(byId('filesize').value),
            done = format(size, 2),
            f = Path.basename(filename).replace(/\.[^\.]+$/,'');

        let tooLarge = checkBlob(size);
        if (!tooLarge) {
            byId('form-fields').setAttribute('style', 'display:none');
            byId('progress').innerHTML = Config.ipfs.ui.requesting + '...';
            timeout(Config.ipfs.ui.reqTimeoutDelay, fetch(filename)).then(function(res) {
                byId('progress').innerHTML = Config.ipfs.ui.downloading + '...';
                res.blob()
                    .then(blob => {handleBlob(blob, size, done, f);})
                    .catch(err => {alert(err);});
            }).catch(function(error) {
                alert(Config.err.reqTimeout);
            });
        }
    }

    function first(buf, offset) {
        if (offset >= buf.length) return -1;
        for (var i = offset; i < buf.length; i++) {
            if (buf[i] === matcher[0]) {
                let full = true;
                for (var j = i, k = 0; j < i + matcher.length; j++, k++) {
                    if (buf[j] !== matcher[k]) {
                        full = false;
                        break;
                    }
                }
                if (full) return j - matcher.length;
            }
        }
        let idx = i + matcher.length - 1;
        return idx;
    }

    function format(bytes, decimals) {
        if(bytes === 0) return '0 B';
        if (!bytes) return '';
        const k = 1024,
            dm = (decimals || 2) ,
            sizes = ['B','KB','MB','GB','TB','PB','EB','ZB','YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k)),
            re = /^(\d+)\.(\d)$/,
            val = parseFloat((bytes/Math.pow(k, i)).toFixed(dm));
        let text = val.toString();
        if (text.match(re)) text = text + '0';
        return text + ' ' + sizes[i];
    }

    function handleBlob(blob, size, done, f) {
        let buffered, byteCount = 0, file, needHeader = true, wcrypt;
        BlobToBuffer(blob, (err, buf) => {
            if (err) console.error(err);
            let last = 0,
                offset = 0;
            byId('form-fields').setAttribute('style', 'display:none')
            while (true) {
                let idx = first(buf, offset - matcher.length + 1);
                if (idx !== -1 && idx < buf.length) {
                    if (needHeader) {
                        needHeader = false;
                        wcrypt = readHeader(buf, last, idx);
                    }
                    else {
                        wcrypt.rawDecrypt(buf.slice(last, idx))
                             .then(data => {
                                 setTimeout(() => {
                                     byteCount = byteCount + data.length;
                                     if (!file) file = Buffer.from(data);
                                     else file = Buffer.concat([file, data]);
                                     let percent = `${ ((byteCount / size) * 100).toFixed(2) }%`;
                                     let complete = `(${ format(byteCount, 2) } of ${ done })`;  
                                     byId('progress').innerHTML = Config.ipfs.ui.decrypting +
                                         ` ${ percent }<br>${ complete }`;
                                     if (byteCount === size) {
                                         const ab = toArrayBuffer(file);
                                         const b = new Blob([new Uint8Array(ab)]);
                                         FileSaver.saveAs(b, f);
                                         modal.style.display = 'none';
                                     }
                                 }, Config.ipfs.ui.decryptUpdateDelay);
                             }).catch((err) => {console.error(err);});
                    }
                    offset = idx + matcher.length;
                    last = offset;
                }
                else {
                    buffered = buf.slice(last);
                    break;
                }
            }
        });
    }

    function handleClicks(e) {
        let target = e.target || e.srcElement;
        if (target.getAttribute('value') == Config.ipfs.ui.decrypt)
            showModal(target);
        else if (target.getAttribute('value') == Config.ipfs.ui.download)
            download();
    }

    function readHeader(buf, last, idx) {
        try {
            let passphrase = byId('passphrase').value;
            byId('passphrase').value = null;
            let data = Wcrypt.parseHeader(buf.slice(last, idx));
            data.material.passphrase = passphrase;
            return new Wcrypt.cipher(data);
        }
        catch (err) {console.error(err);}
    }

    function showModal(target) {
          let filename = prefix + target.parentNode.parentNode
              .querySelector('td:nth-child(1) > a').getAttribute('href'),
              filesize = target.parentNode.parentNode
                  .querySelector('td:nth-child(2)').getAttribute('bytes'),
              decrypted = decodeURI(Path.basename(filename)
                  .replace(/\.[^\.]+$/,''));
          byId('form-fields').setAttribute('style', 'display:block')
          byId('progress').innerHTML = '';
          byId('modal-title').innerHTML = decrypted;
          byId('filename').setAttribute('value', filename);
          byId('filesize').setAttribute('value', filesize);
          modal.style.display = 'block';
          content.style.animation = opener;
    }

    function timeout(ms, promise) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                reject(new Error("timeout"))
            }, ms);
            promise.then(resolve, reject);
        });
    }

    document.body.addEventListener('click', handleClicks,false);

});
