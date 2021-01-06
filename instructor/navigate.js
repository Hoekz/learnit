const simpleGit = require('simple-git');
const course = require('../common/course');
const progress = require('./progress');
const { moduleToBranch, chapterToBranch } = require('../common/utils');

const git = simpleGit();

const setModule = (module) => goTo(moduleToBranch(module));

const setChapter = async (module, chapter) => {
    const commit = progress.current(module, chapter);
    
    if (commit) {
        return goTo(commit);
    }

    const chapterBranch = chapterToBranch(module, chapter);
    const commits = await course.getCommits(moduleToBranch(module), chapterBranch);

    return goTo(commits.length ? commits[commits.length - 1].hash : chapterBranch);
};

const nextStep = async () => {
    const state = await course.getState();
    const steps = await course.getSteps(state.module, state.chapter);

    await new Promise(res => setTimeout(res, 10000));

    if (!steps.length) {
        return false;
    }

    if (!state.step) {
        return goTo(steps[0].hash);
    }

    const current = steps.findIndex(step => step.hash === state.commit);

    if (current === steps.length - 1 || current === -1) {
        return false;
    }

    return goTo(steps[current+1].hash);
};

const prevStep = async () => {
    const state = await course.getState();

    if (!state.commit) {
        return false;
    }

    const steps = await course.getSteps(state.module, state.chapter);

    const current = steps.findIndex(step => step.hash === state.commit);

    if (current <= 0) {
        return false;
    }

    return goTo(steps[current-1].hash);
};

const isFirstStep = async () => {
    const state = await course.getState();

    if (!state.commit) {
        return false;
    }

    const steps = await course.getSteps(state.module, state.chapter);

    return !steps.length || state.commit === steps[0].hash;
};

const isLastStep = async () => {
    const state = await course.getState();

    if (!state.commit) {
        return false;
    }

    const steps = await course.getSteps(state.module, state.chapter);

    return !steps.length || state.commit === steps[steps.length - 1].hash;
};

const goTo = async (commitOrBranch) => {
    try {
        await git.checkout(commitOrBranch);
        return true;
    } catch(e) {
        console.log(e);
        return false;
    }
};

module.exports = {
    setModule, setChapter,
    nextStep, prevStep,
    isFirstStep, isLastStep, goTo,
};
