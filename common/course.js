const fs = require('fs').promises;
const Saveable = require('./saveable');

const simpleGit = require('simple-git');
const { branchToModule, branchToChapter, moduleToBranch, chapterToBranch } = require('../instructor/utils');
const git = simpleGit();

const courseMap = new Saveable('course', null);

const getBranches = async (prefix, describe = identity) => {
    const branches = await git.branch(['--list', `${prefix}*`]);
    const config = await git.listConfig();

    return branches.all.slice().sort().map((branch, index) => ({
        key: index < 10 ? (index + 1).toString().split('').pop() : null,
        value: branch,
        name: config.values['.git/config'][`branch.${branch}.description`] || describe(branch),
    }));
};

const getCommits = async (from, to) => {
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
const getChapters = (module) => getBranches(chapterToBranch(module, ''), (b) => branchToChapter(b)[1]);
const getSteps = async (module, chapter) => {
    const commits = await getCommits(moduleToBranch(module), chapterToBranch(module, chapter));
    const start = commits.findIndex(commit => commit.message.startsWith('chapter-start'));
    const end = commits.findIndex(commit => commit.message.startsWith('chapter-end'));

    return commits.slice(end, start + 1).reverse();
};

const mapCourse = async () => {
    if (courseMap.value) {
        return courseMap.value;
    }

    courseMap.value = await getModules();

    for (const module of courseMap.value) {
        module.chapters = await getChapters(module.value);

        for (const chapter of module.chapters) {
            chapter.steps = await getSteps(module.value, chapter.value);
        }
    }

    await courseMap.save();

    return courseMap.value;
};

const getState = async () => {
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

    const commit = await git.revparse(['HEAD']);
    
    if (current.includes('-chapter-')) {
        const [module, chapter] = branchToChapter(current);
        
        return {
            module: config.values['.git/config'][`branch.${module}.description`] || readable('module-')(module),
            chapter: config.values['.git/config'][`branch.${current}.description`] || readable('module-')(chapter),
            commit: commit,
        };
    }
    
    const map = await mapCourse();

    for (const module of map) {
        for (const chapter of module.chapters) {
            for (const step of chapter.steps) {
                if (step.hash === commit) {
                    return {
                        module: module.value,
                        chapter: chapter.value,
                        commit: commit,
                    };
                }
            }
        }
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
