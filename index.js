#!/usr/bin/env node

const courses = require('./cli/courses');
const modules = require('./cli/modules');
const chapters = require('./cli/chapters');
const steps = require('./cli/steps');
const createCommand = require('./cli/create-command');
const deleteCommand = require('./cli/delete-command');
const instructor = require('./instructor');
const output = require('./output');
const { snake, underscore } = require('./cli/utils');
const { unrecognized } = require('./common/errors');
const general = require('./cli/general');

const { getBranchConfig } = require('./cli/git-helpers');
const { isGitRepo } = require('./common/git-fs');

const parseArg = (type, str) => {
    switch (type) {
        case 'STR': return str;
        case 'BOOL': return !str || str.toLowerCase() === 'true';
        case 'STR[]': return str.split(',');
    }
};

const processCommand = ({ command, args }, argv) => {
    const parsedArgs = {};
    const allArgs = Object.entries(args);
    const namedArgs = allArgs.filter(([key, options]) => options.named);
    const unnamedArgs = allArgs.filter(([key, options]) => !options.named);

    argv.forEach(arg => {
        if (arg.startsWith('--')) {
            const argKey = arg.includes('=') ? arg.substr(2, arg.indexOf('=') - 2) : arg.substr(2);
            const argValue = arg.includes('=') ? arg.substr(arg.indexOf('=') + 1) : '';

            try {
                const [key, options] = namedArgs.find(([key]) => snake(key) === argKey);
                parsedArgs[key] = parseArg(options.type, argValue);
            } catch (e) {
                unrecognized.arg(argKey);
            }

        } else if (unnamedArgs.length) {
            const [key, options] = unnamedArgs.shift();
            parsedArgs[key] = parseArg(options.type, arg);
        } else {
            console.log('Too many unnamed arguments supplied.');
            process.exit();
        }
    });

    allArgs.filter(([key, options]) => !options.optional).forEach(([key]) => {
        if (!(key in parsedArgs)) {
            console.log(`Missing required argument '${snake(key)}'.`);
            process.exit();
        }
    });

    return command(parsedArgs);
};

const documentation = (first, second, { description, args }) => {
    console.log(second ? `\n  ${first} ${second}` : `\n  ${first}`);
    console.log(`     - ${description}`);

    for (const arg in args) {
        const { named, hint, optional, type, description } = args[arg]; 
        let asArg = named ? `--${snake(arg)}${hint ? `=${hint}` : ''}` : underscore(arg);
        asArg = optional ? `[${asArg}]` : `<${asArg}>`;
        console.log(`      ${asArg}: (${type}) ${description}`);
    }
};

const help = ({ command, subCommand }) => {
    if (!command) {
        console.log('Learn It is a tool for creating and consuming knowledge through a structured git repository.');
        for (const command in commands) {
            help({ command });
        }

        return;
    }

    if (!(command in commands)) {
        console.log(`No such command '${command}.'`);
        return;
    }

    if (commands[command].description) {
        documentation(command, null, commands[command]);
        return;
    }

    if (!subCommand) {
        for (const subCommand in commands[command]) {
            help({ command, subCommand });
        }

        return;
    }

    if (!(subCommand in commands[command])) {
        console.log(`No such command sequence '${command} ${subCommand}'`);
        return;
    }

    documentation(command, subCommand, commands[command][subCommand]);
};

const helpCommand = {
    description: 'Prints documentation for CLI commands. You can pass hints to limit the return.',
    args: {
        'command': {
            description: 'Only print documentation of the specified command.',
            type: 'STR',
            named: false,
            optional: true,
        },
        'subCommand': {
            description: 'Only print documentation of the specified sub-command',
            type: 'STR',
            named: false,
            optional: true,
        },
    },
    command: help,
};

const writerCommands = {
    'init': courses.create,
    'new': {
        'module': modules.create,
        'chapter': chapters.create,
        'step': steps.create,
        'command': createCommand,
    },
    'list': {
        'modules': modules.list,
        'chapters': chapters.list,
    },
    'update': {
        'step': steps.update,
    },
    'revert': {
        'step': steps.revert,
    },
    'delete': {
        'module': modules.delete,
        'chapter': chapters.delete,
        'command': deleteCommand,
    },
    'finish': {
        'chapter': chapters.finish,
    },
    'summarize': {
        'course': courses.summarize,
        'module': modules.summarize,
        'chapter': chapters.summarize,
    },
    'lock': courses.lock,
    'unlock': courses.unlock,
    ...general,
};

const readerCommands = {
    'start': instructor,
    'output': output,
};

const commands = {};

async function learnit() {
    const [command, ...rest] = process.argv.slice(2);

    if (await isGitRepo()) {
        const { locked } = await getBranchConfig('main');
        
        if (!locked) {
            Object.assign(commands, writerCommands);
        }

        Object.assign(commands, readerCommands);
    } else {
        Object.assign(commands, writerCommands);
    }

    Object.assign(commands, { help: helpCommand, download: general.download });

    if (!command || !(command in commands)) {
        help({});
        process.exit();
    }

    if (!rest.length) {
        if ('command' in commands[command] && commands[command].command instanceof Function) {
            commands[command].command({});
        } else {
            help({ command });
            process.exit();
        }
    } else {
        if (commands[command].command instanceof Function) {
            processCommand(commands[command], rest);
        } else {
            processCommand(commands[command][rest[0]], rest.slice(1));
        }
    }
}

learnit();
