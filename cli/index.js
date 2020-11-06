const courses = require('./courses');
const modules = require('./modules');
const chapters = require('./chapters');
const steps = require('./steps');
const createCommand = require('./create-command');
const { snake, underscore } = require('./utils');

const parseArg = (type, str) => {
    switch (type) {
        case 'STR': return str;
        case 'BOOL': return str.toLowerCase() === 'true';
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
                console.log(`Unrecognized named argument '${argKey}'.`);
                process.exit();
            }

        } else if (unnamedArgs.length) {
            const [key, options] = unnamedArgs.pop();
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

    console.log('calling with', parsedArgs);
    return command(parsedArgs);
};

const documentation = (first, second, { description, args }) => {
    console.log(second ? `\n  ${first} ${second}` : `\n  ${first}`);
    console.log(`     - ${description}`);

    for (const arg in args) {
        let asArg = args[arg].named ? `--${snake(arg)}=${args[arg].hint}` : underscore(arg);
        asArg = args[arg].optional ? `[${asArg}]` : `<${asArg}>`;
        console.log(`      ${asArg}: (${args[arg].type}) ${args[arg].description}`);
    }
};

const help = ({ command, subCommand }) => {
    if (!command) {
        console.log('Learn It is a tool for creating and consuming knowledge through a structured gir repository.');
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

const commands = {
    'init': courses.create,
    'create': {
        'module': modules.create,
        'chapter': chapters.create,
        'step': steps.create,
    },
    'edit': {
        'step': steps.edit,
    },
    'finish': {
        'chapter': chapters.finish,
        'step': steps.finish,
    },
    'summarize': {
        'chapter': chapters.summarize,
        'module': modules.summarize,
        'course': courses.summarize,
    },
    'run': createCommand,
    'help': helpCommand,
};

const [command, ...rest] = process.argv.slice(2);

if (!command || !(command in commands)) {
    help({});
    process.exit();
}

if (!rest.length) {
    if (commands[command].command) {
        commands[command].command({});
    } else {
        help({ command });
        process.exit();
    }
}

if (commands[command].command) {
    processCommand(commands[command], rest);
} else {
    processCommand(commands[command][rest[0]], rest.slice(1));
}
