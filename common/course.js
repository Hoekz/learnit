const Saveable = require('./saveable');
const git = require('../common/git');
const { branchToModule, branchToChapter, moduleToBranch, chapterToBranch } = require('../common/utils');

const courseMap = { value: null };
const state = new Saveable('state', null);

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
    const steps = commits.filter(commit => commit.message.startsWith('step:'));
    const start = commits.indexOf(steps[steps.length - 1]);
    const end = commits.indexOf(steps[0]);

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
            chapter.commits = await getCommits(module.value, chapter.value);
            chapter.steps = await getSteps(module.value, chapter.value);
        }
    }

    return courseMap.value;
};

const saveState = async () => {
    state.value = await getState();
    await state.save();
    return state.value;
}

const getState = async () => {
    const course = process.cwd().split('/').pop();
    const { current } = await git.status();
    const config = await git.listConfig();
    
    if (current === 'main') {
        return { course, module: null, chapter: null, commit: null };
    }
    
    if (current.startsWith('module-')) {
        return {
            course,
            module: config.values['.git/config'][`branch.${current}.description`] || readable('module-')(current),
            chapter: null,
            commit: null,
        };
    }

    const commit = await git.revparse(['HEAD']);

    if (current.includes('-chapter-')) {
        const { chapterFrom } = require('../cli/git-helpers');
        const [module, chapter] = branchToChapter(current);
        const detailedChapter = await chapterFrom(module)(chapter);
        const step = detailedChapter.steps.find(step => step.hash === commit);

        return {
            course,
            module: config.values['.git/config'][`branch.${module}.description`] || readable('module-')(module),
            chapter: config.values['.git/config'][`branch.${current}.description`] || readable('module-')(chapter),
            step: step ? step.message.replace('step: ', '') : null,
            commit: commit,
        };
    }

    const map = await mapCourse();

    for (const module of map) {
        for (const chapter of module.chapters) {
            for (const step of chapter.steps) {
                if (step.hash === commit) {
                    return {
                        course,
                        module: module.name,
                        chapter: chapter.name,
                        step: step.message.replace('step: ', ''),
                        commit: commit,
                    };
                }
            }

            for (const chapterCommit of chapter.commits) {
                if (chapterCommit.hash === commit) {
                    return {
                        course,
                        module: module.name,
                        chapter: chapter.name,
                        step: null,
                        commit: commit,
                    };
                }
            }
        }
    }

    return { course, module: null, chapter: null, commit: null };
};

module.exports = {
    state,
    getModules,
    getChapters,
    getSteps,
    getCommits,
    getState: saveState,
    mapCourse,
};
