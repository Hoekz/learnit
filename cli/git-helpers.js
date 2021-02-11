const simpleGit = require('simple-git');
const { mapCourse } = require('../common/course');
const gitFs = require('../common/git-fs');

const git = simpleGit();

const equals = (str) => (entry) => entry.value === str || entry.name.toLowerCase() === str.toLowerCase();

const isExistingModule = async (module) => {
    const course = await mapCourse();

    return course.some(equals(module));
};

const getModule = async (module) => {
    const course = await mapCourse();

    return course.find(equals(module));
};

const isExistingChapter = async (module, chapter) => {
    const course = await mapCourse();
    const { chapters } = course.find(equals(module));

    return chapters.some(equals(chapter));
};

const chapterFrom = (module) => async (chapter) => {
    const { chapters } = await getModule(module);

    return chapters.find(equals(chapter));
};

const isExistingStep = async (module, chapter, stepLabel) => {
    const { steps } = await chapterFrom(module)(chapter);

    return steps.find(step => step.message.includes(stepLabel));
};

const nextChapterIndex = async (module) => {
    const { chapters } = await getModule(module);

    return chapters.length < 9 ? `0${chapters.length + 1}` : `${chapters.length + 1}`;
};

const lastStepFrom = async (module, chapter) => {
    const { steps } = await chapterFrom(module)(chapter);
    return steps[steps.length - 1];
};

const stepFrom = async (module, chapter, step) => {
    const { steps } = await chapterFrom(module)(chapter);
    return steps.find(s => s.message === `step: ${step}` || s.message === step || s.hash === step);
};

const setBranchValue = async (branch, key, value) => {
    await git.addConfig(`learnit.${branch}.${key}`, JSON.stringify(value));

    return value;
};

const setBranchDescription = async (branch, value) => {
    await git.addConfig(`branch.${branch}.description`, value);

    return value;
};

const hasCommandConfig = async () => {
    const configs = await git.listConfig();

    if (!configs.files.includes('.git/config')) {
        return false;
    }

    for (const key in configs.values['.git/config']) {
        if (/^learnit\..*\.commands$/.test(key)) return true;
    }

    return false;
};

const getBranchConfig = async (branch) => {
    const configs = await git.listConfig();
    const config = {};

    if (!branch || !configs.files.includes('.git/config')) {
        return config;
    }
    
    for (const [key, value] of Object.entries(configs.values['.git/config'])) {
        if (key.startsWith(`learnit.${branch}`)) {
            config[key.replace(`learnit.${branch}.`, '')] = JSON.parse(value);
        }
    }

    return config;
};

getBranchConfig.module = async (module) => {
    const { value } = await getModule(module);
    return getBranchConfig(value);
};

const deleteBranchSettings = async (branch) => {
    await git.raw('config', '--unset-all', `learnit.${branch}`);
    await git.raw('config', '--unset', `branch.${branch}.description`);
};

const saveConfig = async () => {
    const configs = await git.listConfig();
    const config = {};

    if (!configs.files.includes('.git/config')) {
        return;
    }

    for (const [key, value] of Object.entries(configs.values['.git/config'])) {
        if (key.startsWith('learnit.') || (key.startsWith('branch.') && key.endsWith('.description'))) {
            config[key] = value;
        }
    }

    await gitFs.writeFile('learnit.config.json', JSON.stringify(config, null, 4));
};

const loadConfig = async () => {
    let config;

    try {
        config = JSON.parse(await gitFs.readFile('learnit.config.json'));
    } catch (e) {
        console.log('Either no config file found to load from or there was a problem parsing.');
        process.exit();
    }

    for (const [key, value] of Object.entries(config)) {
        await git.addConfig(key, value);
    }
};

module.exports = {
    hasCommandConfig,
    getBranchConfig, saveConfig, loadConfig,
    setBranchValue, setBranchDescription, deleteBranchSettings,
    isExistingModule, getModule,
    isExistingChapter, chapterFrom, nextChapterIndex,
    isExistingStep, lastStepFrom, stepFrom,
};
