const progress = require('./progress');
const navigate = require('./navigate');
const prompter = require('./prompter');
const course = require('../common/course');

async function next() {
    const state = await course.getState();

    if (!state.module) {
        const module = await prompter.chooseModule();
        return module ? await navigate.setModule(module) : null;
    }

    if (!state.chapter) {
        const chapter = await prompter.chooseChapter(state.module);

        if (chapter === 'back') {
            return await navigate.goTo('main');
        }

        return await navigate.setChapter(state.module, chapter);
    }

    await progress.update(state.module, state.chapter, state.commit);

    if (await navigate.isLastStep()) {
        await progress.completed(state.module, state.chapter);
    }

    const choice = await prompter.navigateChapter(state);

    if (choice === 'back') {
        return await navigate.setModule(state.module);
    }

    if (choice === 'next' || choice === 'start') {
        return await navigate.nextStep();
    }

    if (choice === 'prev') {
        return await navigate.prevStep();
    }
}

module.exports = {
    description: 'Start reading the course through the interactive instructor.',
    args: {},
    async command() {
        let ableToNavigate = true;
    
        while (ableToNavigate) {
            try {
                ableToNavigate = await next();
            } catch(e) {
                console.log(e);
                ableToNavigate = false;
            }
        }
    },
};
