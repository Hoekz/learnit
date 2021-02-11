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
        if (!oldState ||
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
    description: 'Runs and concats all commands setup to run in the repo.',
    args: {
        delta: {
            description: 'Attaches a listener to output the commit delta on navigation changes.',
            type: 'BOOL',
            named: true,
            optional: true,
        },
        noDelta: {
            description: 'Attaches a listener to output from instructor set commands only.',
            type: 'BOOL',
            named: true,
            optional: true,
        },
    },
    async command({ delta, noDelta }) {
        if (!delta || noDelta) {
            console.log('Loading all commands...');
            status.connect('commands');
            await loadAllCommands();
            console.log(`Loaded ${allCommands.length} commands.`);
            // allCommands.forEach(cmd => console.log(cmd));
            state.onSave(onChange(state.value, updateOutput));
            updateOutput(state.value);
        }

        if (delta || !noDelta) {
            status.connect('delta');
            state.onSave(onChange(state.value, logDelta));
            logDelta(state.value);
        }

        while (true) await new Promise(res => setTimeout(res, 5000));
    },
};
