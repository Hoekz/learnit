const fs = require('fs').promises;

const simpleGit = require('simple-git');
const { branchToModule, branchToChapter, moduleToBranch, chapterToBranch } = require('./utils');
const git = simpleGit();

let courseMap = (() => {
    try {
        return require('.course');
    } catch(e) {
        return null;
    }
})();

const save = async () => fs.writeFile('.course.json', JSON.stringify(courseMap), 'utf-8');

const getBranches = async (prefix, describe = identity) => {
    console.log('getting branches with prefix', prefix);
    const branches = await git.branch(['--list', `${prefix}*`]);
    const config = await git.listConfig();

    return branches.all.slice().sort().map((branch, index) => ({
        key: index < 10 ? (index + 1).toString().split('').pop() : null,
        value: branch,
        name: config.values['.git/config'][`branch.${branch}.description`] || describe(branch),
    }));
};

const getCommits = async (from, to) => {
    console.log('getting commits from', from, 'to', to);
    const logs = await git.log({ from, to });
    return logs.all;
};

const readable = (prefix) => (branch) => (branch
    .replace(prefix, '')
    .split('-')
    .map(word => word[0].toUpperCase() + word.substr(1))
    .join(' ')
);

const getModules = () => getBranches('module', branchToModule);
const getChapters = (module) => getBranches(chapterToBranch(module, ''), branchToChapter);
const getSteps = async (module, chapter) => {
    const commits = await getCommits(moduleToBranch(module), chapterToBranch(module, chapter));
    const start = commits.findIndex(commit => commit.message.startsWith('chapter-start'));
    const end = commits.findIndex(commit => commit.message.startsWith('chapter-end'));

    return commits.slice(end, start + 1).reverse();
};

const mapCourse = async () => {
    if (courseMap) {
        return courseMap;
    }

    courseMap = await getModules();

    for (const module of courseMap) {
        module.chapters = await getChapters(module.value);

        for (const chapter of module.chapters) {
            chapter.steps = await getSteps(module.value, chapter.value);
        }
    }

    await save();

    return courseMap;
};

const getState = async () => {
    const map = await mapCourse();
    const { current } = await git.status();
    const config = await git.listConfig();

    if (current === 'master') {
        return { module: null, chapter: null, commit: null };
    }

    if (current.startsWith('module-')) {
        return {
            module: config.values['.git/config'][`branch.${current}.description`] || readable('module-')(current),
            chapter: null,
            commit: null,
        };
    }

    if (current.includes('-chapter-')) {
        const [module, chapter] = branchToChapter(current);

        const { latest } = await git.log(['-n', '1']);

        return {
            module: config.values['.git/config'][`branch.${module}.description`] || readable('module-')(module),
            chapter: config.values['.git/config'][`branch.${current}.description`] || readable('module-')(chapter),
            commit: latest.hash,
        };
    }

    

    return { module: null, chapter: null, commit: null };
};

module.exports = {
    getModules,
    getChapters,
    getSteps,
    getState,
    mapCourse
};
