
const modulePattern = ['module', '$0'];
const chapterPattern = ['$0', 'chapter', '$1'];

const identity = e => e;

const apply = (pattern, ...args) => pattern
    .map(p => p.startsWith('$') ? args[p.substr(1)].split(' ').join('-') : p)
    .join('-')
    .toLowerCase();

const unapply = (pattern, branch) => branch.split('-').reduce((args, p) => {
    if (pattern.includes(p)) {
        args.push('');
        return args;
    }

    const word = p[0].toUpperCase() + p.substr(1);
    const index = args.length ? args.length - 1 : 0;

    args[index] = (args[index] + ' ' + word).trim();

    return args;
}, ['']).filter(identity);

const isBranch = (str) => str && !str.includes(' ') && str.includes('-');

const moduleToBranch = (module) => isBranch(module) ? module : apply(modulePattern, module);
const chapterToBranch = (module, chapter) => {
    console.log('called with:', JSON.stringify(module), JSON.stringify(chapter));
    if (isBranch(chapter)) {
        return chapter;
    }

    if (isBranch(module)) {
        [module] = unapply(modulePattern, module);
    }

    return apply(chapterPattern, module, chapter);
};

const branchToModule = (branch) => isBranch(branch) ? unapply(modulePattern, branch)[0] : branch;
const branchToChapter = (branch) => isBranch(branch) ? unapply(chapterPattern, branch) : branch;

module.exports = {
    moduleToBranch, chapterToBranch,
    branchToModule, branchToChapter,
};
