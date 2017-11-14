'use strict';
const fs = require('fs'),
    he = require('he'),
    path = require('path'),
    readFile = require('util').promisify(fs.readFile);

module.exports = exports = function (util) {

    let html = this,
      mainDirRegex = new RegExp((util.cfg.ipfs.mainSubdir).replace(/^\//,''));

    let integrityHash = '';
    readFile(__dirname + path.sep + '..' + path.sep + '..' +
        path.sep + util.cfg.ipfs.cryptoLib.integrityHash)
            .then((hash) => {integrityHash = hash;})
            .catch(err => {throw err;});

    html.addRow = (item, size, date, button) => {
        const formatted = util.format(size),
            s = '    ',
            ss = s.repeat(5);
        return `            ${ ss }<tr>
            ${ ss }${ s }<td>${ item }</td>
            ${ ss }${ s }<td bytes = "${ size }" class = "size">${ formatted }</td>
            ${ ss }${ s }<td>${ date }</td>
            ${ ss }${ s }<td>${ button }</td>
            ${ ss }</tr>`;
    };

    html.createPointers = (opt, paths) => {
        return new Promise((resolve, reject) => {
            resolve(createPointers(opt, paths));
        });
    };

    html.createLink = (href, text, isLinked, isDir) => {
        href = encodeURI(href);
        text = he.encode(text);
        let c = '', e = '', i = '', lo = '', lc = '', o = '';
        if (href && isLinked) { e = '</a>'; lo = '<a href="'; lc = '">';}
        if (isDir) { o = '['; c = ']';i = '/' + util.cfg.ipfs.mainIndex}
        return `${ lo }${ href }${ i }${ lc }${ o }${ text }${ c }${ e }`;
    };

    html.decryptButton = () => {
        return '<input class="button button-clear" ' +
            'type="submit" value="' + util.cfg.ipfs.ui.decrypt + '">';
    };

    html.finish = (paths, items) => {
        items.push(html.getFooter());
        let p = paths.ipfs.item + '/' + util.cfg.ipfs.mainIndex;
        if (paths.type === 'file') p = path.parse(paths.ipfs.item).dir + '/' + util.cfg.ipfs.mainIndex;

        return {
            path: p,
            content: Buffer.from(items.join("\n"), 'utf8')
        };
    };

    html.getFooter = (footerLink, footerText) => {
        if (!footerLink) footerLink = util.cfg.ipfs.footerLink;
        if (!footerText) footerText = util.cfg.ipfs.footerText;
        let footer = `                        </tbody>
                    </table>
           <footer class="footer">
                  <a id="footer-link" href="${ footerLink }">${ footerText }</a>
           </footer>
           </section>
          </main>
         </body>
        </html>`;
        return footer;
    };

    html.getHeader = (opt, paths) => {
        let dir = paths.ipfs.item;
        if (paths.type === 'file') dir = path.parse(paths.ipfs.item).dir;
        let replace = opt.directory;
        if (dir.match(/\//)) replace = replace + '/';
        const titlePath = dir.replace(replace, ''),
            pathParts = titlePath.split('/');
        const nav = generateNavigation(paths, pathParts);
        return generateHeader(opt, nav.root, titlePath, nav.breadcrumb);
    };

    function createPointers(opt, paths) {
        let dir = {}, entries = [], prev = '';
        let parts = (paths.ipfs.item).split(path.sep);
        let last = parts[parts.length - 1];
        parts = parts.slice(0, parts.length - 1);
        if ((paths.type === 'file') && (parts.length === 1) &&
            (parts[0] === opt.directory)) return [];
        for (let i=0; i < parts.length; i++) {
            let file = parts[i] + '/' + util.cfg.ipfs.mainIndex;
            if (prev) file = prev + '/' + file;
            if (parts[i+1]) dir[file] = parts[i+1];
            else dir[file] = last;
            const item = html.createLink(dir[file], dir[file], true, true);
            const content = Buffer.from(
                getPointer(opt, prev, parts[i], dir[file]) +
                html.addRow(item, '', '', '') +
                html.getFooter()
            , 'utf8');
            entries.push({ path: file, content: content });
            if (!prev) prev = prev + parts[i];
            else prev = prev + '/' + parts[i];
        }
        return entries;
    }

    function generateHeader(opt, rel, titlePath, linkPath) {
        const cssName = path.basename(opt.mainCss),
            d = opt.directory + '/styles/',
            dialogName = path.basename(opt.dialogCss),
            fontName = path.basename(opt.fontCss),
            j = opt.directory + '/js/',
            jsName = path.basename(opt.jsPath);
        const header  = `<!doctype html>
    <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="author" content="ipfsecret">
            <meta name="description" content="${ opt.directory  }">
            <title>${ titlePath }</title>
            <link rel="stylesheet" href="${ rel }${ d }normalize.css">
            <link rel="stylesheet" href="${ rel }${ d }${ fontName }">
            <link rel="stylesheet" href="${ rel }${ d }${ cssName }">
            <link rel="stylesheet" href="${ rel }${ d }${ dialogName }">
            <style>
                table.listing td.size {text-align: right;}
                table.listing th.size {text-align: right;}
                .footer {font-size:40%}
            </style>
            <script>
                // Base image: https://pixabay.com/en/castle-key-close-steel-iron-2218359
                var fav = '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';
                var head = document.getElementsByTagName('head')[0];
                var link = document.createElement('link');
                link.rel = 'shortcut icon';
                link.href = 'data:image/png;base64,' + fav;
                head.appendChild(link);
            </script>
            <script integrity="sha512-${ integrityHash }"
                src="${ rel }${ j }${ jsName }"></script>
         </head>
         <body>
            <div class="modal-sec-overlay" id="mymodal">
                <div class="modal-box modal-small" id="modal-box">
                    <button id="close-modal" class="close-btn">x</button>
                    <div class="modal-title" id="modal-title">UNKNOWN ERROR</div>
                    <div class="modal-content">
                        <div id="form-fields">
                            <label for="passphrase">${ util.cfg.ipfs.ui.passphrase }</label>
                            <input id="passphrase" type="password" style="width:150px;"/>
                            <input id="download-button" class="button button-clear"
                                type="submit" value="${ util.cfg.ipfs.ui.download }">
                            <input type="hidden" id="filename"/><br/>
                            <input type="hidden" id="filesize"/><br/>
                        </div>
                        <div id="progress"></div>
                    </div>
                </div>
            </div>
             <main class="wrapper">
                 <section class="container">
                     <h3 class="title">${ linkPath }</h3>
                 </section>
                 <section class="container" id="examples">
                     <table class="listing">
                         <thead>
                             <tr>
                                 <th>${ util.cfg.ipfs.ui.name }</th>
                                 <th class="size">${ util.cfg.ipfs.ui.size }</th>
                                 <th>${ util.cfg.ipfs.ui.modified }</th>
                                 <th>&nbsp;</th>
                            </tr>
                        </thead>
                        <tbody>`;
        return header;    
    }

    function generateNavigation(paths, parts) {
        const relative = new RegExp('^[\.,' + path.sep + ']+$');
        if (
            paths.source.clean.match(relative)
                ||
            ((paths.type === 'file') && (parts.length === 1) && parts[0] === '')
        ) {
            return {breadcrumb: '', root: './'}
        }
        else {
            let nav = [],
                prev = '';
            for (let i = (parts.length - 1); i >= 0; --i) {
                prev = prev + '../';
                if (i === parts.length - 1) nav.push(` ${ parts[i] }`);
                else nav.push(
                    `<a href="${ prev }${ parts[i] }/${ util.cfg.ipfs.mainIndex }">
                        ${ parts[i] }
                    </a>`);
            }
            nav.reverse();
            return {breadcrumb: nav.join('/'), root: prev}
        }
    }

    function getPointer (opt, p, current, next) {
        if (p.match(mainDirRegex))
            p = p.replace(mainDirRegex, '');
        if (current.match(mainDirRegex))
            current = '';
        let navString = p + '/' + current;
        const parts = navString.split('/');
        const nav = generatePointerNav(parts);
        return generateHeader(opt, nav.root, p, nav.breadcrumb);
    }

    function generatePointerNav(parts) {
        let nav = [],
            prev = '';
        for (let i = (parts.length - 1); i >= 0; --i) {
            if (parts[i]) {
                if (i === parts.length - 1) nav.push(` ${ parts[i] }`);
                else nav.push(
                    `<a href="../${ prev }${ parts[i] }/${ util.cfg.ipfs.mainIndex }">
                        ${ parts[i] }
                    </a>`);
                prev = prev + '../';
            }
        }
        nav.reverse();
        return {breadcrumb: nav.join('/'), root: prev}
    }

};
