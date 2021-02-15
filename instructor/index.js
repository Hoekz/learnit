const progress = require('./progress');
const navigate = require('./navigate');
const prompter = require('./prompter');
const course = require('../common/course');
const status = require('../common/status');
const { wait } = require('../common/utils');
const { hasCommandConfig } = require('../cli/git-helpers');
const gitFs = require('../common/git-fs');

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

        try {
            await gitFs.access('learnit.config.json');
            console.log(`Detected 'learnit.config.json'. Run 'learnit config --load' to ensure course is properly configured.`);
            process.exit(1);
        } catch (e) {}

        status.connect('instructor');

        const deltaRunning = await status.check('delta');

        if (!deltaRunning) {
            console.log('To view the code changes a step refers to, run `learnit output --delta` in another terminal.');
            await wait(5000);
        }

        const hasCommands = await hasCommandConfig();

        if (hasCommands) {
            let commandsRunning = await status.check('commands');

            console.log('This course runs commands to better illustrate the affects changes have.');
            console.log('To view the output, run `learnit output --no-delta` in another terminal.');

            while (!commandsRunning) {
                await wait(3000);
                commandsRunning = await status.check('commands');
            }
        }
    
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
