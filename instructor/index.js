const progress = require('./progress');
const settings = require('./settings');
const navigate = require('./navigate');
const prompter = require('./prompter');
const course = require('./course');

async function next() {
    const state = await course.getState();

    if (!state.module) {
        const module = await prompter.chooseModule();
        return await navigate.setModule(module);
    }

    if (!state.chapter) {
        const chapter = await prompter.chooseChapter(state.module);

        if (chapter === 'back') {
            return await navigate.goTo('master');
        }

        return await navigate.setChapter(state.module, chapter);
    }

    await progress.update(state.module, state.chapter, state.commit);

    if (await navigate.isLastStep()) {
        await progress.completed(state.module, state.chapter);
    }

    const choice = await prompter.navigateChapter();

    if (choice === 'back') {
        return await navigate.setModule(state.module);
    }

    if (choice === 'next') {
        return await navigate.nextStep();
    }

    if (choice === 'prev') {
        return await navigate.prevStep();
    }
}

async function main() {
    let ableToNavigate = true;

    while (ableToNavigate) {
        try {
            ableToNavigate = await next();
        } catch(e) {
            console.log(e);
            ableToNavigate = false;
        }
    }
}

main();
