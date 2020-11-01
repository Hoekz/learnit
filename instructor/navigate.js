const simpleGit = require('simple-git');
const course = require('./course');
const git = simpleGit();

const setModule = async (module) => {
    return goTo(`module-${module}`);
};

const setChapter = async (module, chapter) => {
    return goTo(`${module}-chapter-${chapter}`);
};

const nextStep = async () => {
    const state = await course.getState();

    if (!state.commit) {
        return false;
    }

    const steps = await course.getSteps(state.module, state.chapter);

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

    return state.commit === steps[0].hash;
};

const isLastStep = async () => {
    const state = await course.getState();

    if (!state.commit) {
        return false;
    }

    const steps = await course.getSteps(state.module, state.chapter);

    return state.commit === steps[steps.length - 1].hash;
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
