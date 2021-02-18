const { getBranchConfig } = require('../cli/git-helpers');
const { state, mapCourse } = require('../common/course');
const status = require('../common/status');
const Command = require('./command');
const logDelta = require('./delta');

const allCommands = [];

const loadAllCommands = async () => {
    const course = await mapCourse();

    const { commands } = await getBranchConfig('main');

    if (commands && commands.length) {
        commands.forEach((cmd) => allCommands.push(new Command({ ...cmd })));
    }

    for (const module of course) {
        const { commands } = await getBranchConfig(module.value);

        if (commands && commands.length) {
            commands.forEach((cmd) => {
                allCommands.push(new Command({
                    ...cmd, module: module.value
                }));
            });
        }

        for (const chapter of module.chapters) {
            const { commands } = await getBranchConfig(chapter.value);

            if (commands && commands.length) {
                commands.forEach((cmd) => {
                    allCommands.push(new Command({
                        ...cmd, module: module.value, chapter: chapter.value
                    }));
                });
            }

            for (const step of chapter.steps) {
                const { commands } = await getBranchConfig(`${chapter.value}.${step.message.replace(/^step: /, '')}`);

                if (commands && commands.length) {
                    commands.forEach((cmd) => {
                        allCommands.push(new Command({
                            ...cmd, module: module.value, chapter: chapter.value, step: step.message
                        }));
                    });
                }
            }
        }
    }
};

const updateOutput = async (newState) => {
    for (const command of allCommands) {
        if (command.running && !(await command.matches(newState))) {
            await command.stop();
        }

        if (!command.running && await command.matches(newState)) {
            await command.start();
        }
    }
};

const onChange = (initial, listener) => {
    let oldState = JSON.parse(JSON.stringify(initial));

    return (newState) => {
        if (newState && !oldState ||
            oldState.module !== newState.module ||
            oldState.chapter !== newState.chapter ||
            oldState.step !== newState.step
        ) {
            oldState = JSON.parse(JSON.stringify(newState));
            listener(newState);
        }
    };
};

module.exports = {
    snippets: {
        description: 'Attaches a listener to output the commit delta and code references on navigation changes.',
        args: {},
        async command() {
            status.connect('delta');
            state.onSave(onChange(state.value, logDelta));
            logDelta(state.value);

            while (true) await new Promise(res => setTimeout(res, 5000));
        },
    },
    commands: {
        description: 'Attaches a listener to output from instructor created commands that run on navigation changes.',
        args: {},
        async command() {
            console.log('Loading all commands...');
            status.connect('commands');
            await loadAllCommands();
            console.log(`Loaded ${allCommands.length} commands.`);
            state.onSave(onChange(state.value, updateOutput));
            updateOutput(state.value);

            while (true) await new Promise(res => setTimeout(res, 5000));
        },
    },
};
