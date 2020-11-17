const simpleGit = require('simple-git');
const { getState, mapCourse } = require('../common/course');
const { chapterToBranch, moduleToBranch } = require('../common/utils');

const git = simpleGit();

const equals = (str) => (entry) => entry.value === str || entry.name === str;

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

    return steps.find(step => step.message.contains(stepLabel));
};

const nextChapterIndex = async (module) => {
    const { chapters } = await getModule(module);

    return chapters.length < 9 ? `0${chapters.length + 1}` : `${chapters.length + 1}`;
};

const lastStepFrom = async (module, chapter) => {
    const { steps } = await chapterFrom(module)(chapter);
    return steps[steps.length - 1];
};

const setBranchValue = async (branch, key, value) => {
    await git.addConfig(`learnit.${branch}.${key}`, JSON.stringify(value));

    return value;
};

const setBranchDescription = async (branch, value) => {
    await git.addConfig(`branch.${branch}.description`, value);

    return value;
};

const getBranchConfig = async (branch) => {
    const configs = await git.listConfig();
    const config = {};

    for (const [key, value] of Object.entries(configs['.git/config'])) {
        if (key.startsWith(`learnit.${branch}`)) {
            config[key.replace(`learnit.${branch}`, '')] = JSON.parse(value);
        }
    }

    return config;
};

module.exports = {
    getBranchConfig, setBranchValue, setBranchDescription,
    isExistingModule, getModule,
    isExistingChapter, chapterFrom, nextChapterIndex,
    isExistingStep, lastStepFrom,
};