
const modulePattern = ['module', '$0'];
const chapterPattern = ['$0', 'chapter', '$1'];

const apply = (pattern, ...args) => pattern
    .map(p => p.startsWith('$') ? args[p.substr(1)] : p)
    .join('-')
    .toLowerCase();

const unapply = (pattern, branch) => branch.split('-').reduce((args, p, i) => {
    if (pattern[i].startsWith('$')) {
        args[pattern[i].substr(1)] = p;
    }

    return args;
}, []);

const isBranch = (str) => !str.includes(' ') && str.includes('-');

const moduleToBranch = (module) => isBranch(module) ? module : apply(modulePattern, module);
const chapterToBranch = (module, chapter) => {
    if (isBranch(chapter)) {
        return chapter;
    }

    if (isBranch(module)) {
        [module] = unapply(modulePattern, module);
    }

    return apply(chapterPattern, module, chapter);
};

module.exports = { moduleToBranch, chapterToBranch };
