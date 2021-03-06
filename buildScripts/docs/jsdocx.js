const fs       = require('fs'),
      jsdocx   = require('jsdoc-x'),
      helper   = require('../../node_modules/jsdoc-x/src/lib/helper.js'),
      path     = require('path'),
      appNames = [],
      options  = {
          access        : 'all',
          files         : ['./src/**/*.mjs', './docs/app/view/**/*.mjs'],
          includePattern: ".+\\.(m)js(doc)?$",
          excludePattern: "(^|\\/|\\\\)_",
          recurse       : true,
          undocumented  : false
      };

let appDevJsonPath = path.resolve(__dirname, '../webpack/development/json/myApps.json'),
    appDevJson;

if (fs.existsSync(appDevJsonPath)) {
    appDevJson = require(appDevJsonPath);

    Object.entries(appDevJson.apps).forEach(([key, value]) => {
        appNames.push(key);
        options.files.push('.' + value.output + '**/*.mjs')
    });
}

function ns(names, create) {
    names = Array.isArray(names) ? names : names.split('.');

    return names.reduce((prev, current) => {
        if (create && !prev[current]) {
            prev[current] = {};
        }
        if (prev) {
            return prev[current];
        }
    }, this);
}

const neoStructure = [{
    className: null,
    id       : 1,
    isLeaf   : false,
    name     : "src",
    path     : "",
    parentId : null,
    singleton: false
}, {
    className: null,
    collapsed: true,
    id       : 2,
    isLeaf   : false,
    name     : "apps",
    path     : "",
    parentId : null,
    singleton: false
}];

let neoStructureId = 2;

function generateStructure(target, parentId, docs) {
    let namespace = ns(target),
        len       = docs.length,
        className, docItem, i, id, j, hasMatch, isLeaf, path, singleton, srcPath, tagLength;

    // console.log(target);

    Object.entries(namespace).forEach(([key, value]) => {
        id        = ++neoStructureId;
        isLeaf    = Object.entries(value).length < 1;
        singleton = false;
        srcPath   = null;

        hasMatch = false;

        for (i=0; i < appNames.length; i++) {
            if (target.indexOf(appNames[i] + 'Empty.') === 0) {
                path = target.substr(appNames[i].length * 2 + 6);

                className = isLeaf ? appNames[i] + (path ? path + '.' : '.') + key : null;
                // console.log(target);
                // console.log(path);
                // console.log(className);
                hasMatch = true;
                break;
            }
        }

        if (!hasMatch) {
            if (target.indexOf('DocsEmpty.') === 0) {
                path = target.substr(15);

                className = isLeaf ? 'Docs.app.' + (path ? path + '.' : '') + key : null;
            } else {
                path = target.substr(target.indexOf('NeoEmpty.') === 0 ? 9 : 8);

                className = isLeaf ? 'Neo.' + (path ? path + '.' : '') + key : null;
                className = className === 'Neo.Neo' ? 'Neo' : className;
            }
        }

        if (isLeaf) {
            for (i = 0; i < len; i++) {
                docItem = docs[i];

                if ((docItem.$kind === 'class' || docItem.$kind === 'module') && docItem.neoClassName === className) {
                    if (docItem.meta.path.indexOf('neoteric/') > -1) {
                        srcPath = docItem.meta.path.substr(docItem.meta.path.indexOf('neoteric/') + 9) + '/' + docItem.meta.filename;
                    } else if (docItem.meta.path.substr(docItem.meta.path.indexOf('neomjs/') > -1)) {
                        srcPath = docItem.meta.path.substr(docItem.meta.path.indexOf('neomjs/') + 7) + '/' + docItem.meta.filename;
                    } else {
                        srcPath = docItem.meta.path.substr(docItem.meta.path.indexOf('neo/') + 4) + '/' + docItem.meta.filename;
                    }

                    if (docItem.tags) {
                        j         = 0;
                        tagLength = docItem.tags.length;

                        for (; j < tagLength; j++) {
                            if (docItem.tags[j].title === 'singleton') {
                                singleton = true;
                                break;
                            }
                        }
                    }
                }

                if (singleton === true) {
                    break;
                }
            }
        }

        // console.log(className);

        // adjusted paths when running the script inside the neo.mjs node module
        if (srcPath && srcPath.includes('/neo.mjs/')) {
            srcPath = srcPath.substr(srcPath.indexOf('/neo.mjs/') + 9);
        }

        neoStructure.push({
            className: className,
            collapsed: appNames.includes(key) || key === 'Docs',
            id       : id,
            isLeaf   : isLeaf,
            name     : key,
            path     : path,
            parentId : parentId,
            singleton: singleton,
            srcPath  : srcPath
        });

        generateStructure(target + '.' + key, id, docs);
    });
}

jsdocx.parse(options)
    .then(function (docs) {
        let i         = 0,
            len       = docs.length,
            structure = {},
            defaultValue, filename, hasMatch, index, item, j, namespace, path, pathLen, type;

        for (; i < len; i++) {
            item = docs[i];

            docs[i].id = i + 1;

            filename = item.meta.filename;
            filename = filename.substr(0, filename.lastIndexOf('.'));

            path = item.meta.path;
            path = path.replace(/\\/g, '/'); // sync windows paths to macOS

            index = path.indexOf('/src/');

            if (index > -1) {
                path = path.substr(index + 5) + '.';
            } else {
                index = path.indexOf('/src');

                if (index > -1) {
                    path = path.substr(index + 4); // top level files
                } else {
                    index = path.indexOf('/apps/');

                    if (index > -1) {
                        for (j=0; j < appNames.length; j++) {
                            pathLen = path.indexOf(appNames[j].toLowerCase());

                            if (pathLen !== -1) {
                                // top level files
                                if (pathLen === path.length - appNames[j].length) {
                                    path = appNames[j] + path.substr(index + appNames[j].length + 6) + '.';
                                    break;
                                } else {
                                    pathLen = path.indexOf(appNames[j].toLowerCase() + '/');

                                    if (pathLen > -1) {
                                        path = appNames[j] + path.substr(index + appNames[j].length + 6) + '.';
                                        break;
                                    }
                                }
                            }
                        }
                    } else {
                        index = path.indexOf('/docs/');

                        if (index > -1) {
                            path = 'Docs.' + path.substr(index + 10) + '.';
                        }
                    }
                }
            }

            path = path.replace(/\//g, '.');

            filename = path + filename;

            structure[filename] = true;

            hasMatch = false;

            for (j=0; j < appNames.length; j++) {
                if (path.indexOf(appNames[j] + '.') === 0) {
                    ns(appNames[j] + 'Empty.' + filename, true);
                    item.neoClassName = filename;
                    // console.log(item.neoClassName);
                    // console.log(filename);
                    hasMatch = true;
                    break;
                }
            }

            if (!hasMatch) {
                if (path.indexOf('Docs') === 0) {
                    ns('DocsEmpty.' + filename, true);
                    item.neoClassName = 'Docs.app' + filename.substr(4);
                } else {
                    item.neoClassName = filename === 'Neo' ? filename : 'Neo.' + filename;
                    ns('NeoEmpty.' + filename, true);
                }
            }

            namespace = ns(item.neoClassName, true);

            namespace.classData = namespace.classData || [];
            namespace.classData.push(item);

            if (item.description) {
                item.description = item.description.replace(/\n/g, "<br />");
            }

            if (item.params) {
                item.params.forEach(param => {
                    if (param.description) {
                        param.description = param.description.replace(/\n/g, "<br />");
                    }
                });
            }

            if (item.kind === 'member') {
                if (item.comment) {
                    item.meta.lineno += item.comment.split('\n').length;
                }

                if (item.defaultvalue && item.type && item.type.names) {
                    type = item.type.names[0].toLowerCase();

                    if (type.indexOf('array') > -1 || type.indexOf('object') > -1) {
                        defaultValue = item.comment.substr(item.comment.indexOf('=') + 1);
                        defaultValue = defaultValue.substr(0, defaultValue.indexOf('\n'));
                        defaultValue.trim();
                        item.defaultvalue = defaultValue;
                    }
                }
            }

            if (item.memberof === 'module:Neo.config') {
                item.name = 'config.' + item.name;
            }
        }

        helper.writeJSON({
            path  : './docs/output/all.json',
            indent: 4,
            force : true
        }, docs);

        Object.keys(structure).forEach(key => {
            path = key.replace(/\./g, '/');

            helper.writeJSON({
                path  : './docs/output/src/' + path + '.json',
                indent: 4,
                force : true
            }, ns('Neo.' + key));
        });

        // console.log(Neo);

        generateStructure('NeoEmpty',  1, docs);
        generateStructure('DocsEmpty', 2, docs);

        appNames.forEach(key => {
            generateStructure(key + 'Empty', 2, docs);
        });

        neoStructure.sort(function (a, b) {
            if (a.name[0] === a.name[0].toLocaleLowerCase() && b.name[0] === b.name[0].toLocaleLowerCase() ||
                a.name[0] === a.name[0].toLocaleUpperCase() && b.name[0] === b.name[0].toLocaleUpperCase()) {
                return a.name.localeCompare(b.name);
            }
            if (a.name[0] === a.name[0].toLocaleLowerCase()) {
                return -1;
            }
            return 1;
        });

        // console.log(neoStructure);

        helper.writeJSON({
            path  : './docs/output/structure.json',
            indent: 4,
            force : true
        }, neoStructure);
    })
    .catch(function (err) {
        console.log(err.stack);
    });