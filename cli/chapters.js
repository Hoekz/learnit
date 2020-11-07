const { getState, mapCourse } = require('../common/course');

module.exports = {
    create: {
        description: 'Creates a new chapter in a module (defaults to current module).',
        args: {
            chapterTitle: {
                description: 'Title of the new chapter.',
                type: 'STR',
                named: false,
                optional: true,
            },
            module: {
                description: 'The module to create the chapter in. Defaults to current.',
                type: 'STR',
                named: true,
                hint: '<module_branch_or_name>',
                optional: true,
            },
            merge: {
                description: 'Whether the chapter should be merged upon completion.',
                type: 'BOOL',
                named: true,
                hint: '[true]',
                optional: true,
            },
            base: {
                description: 'What point to build the chapter off of. Defaults to the top of the module branch.',
                type: 'STR',
                named: true,
                hint: '<module>',
                optional: true,
            },
        },
        async command({ chapterTitle, module, merge, base }) {
            const state = await getState();
            const course = await mapCourse();

            module = module || state.module;
        },
    },
    finish: {
        description: 'Designates a chapter as completed and optionally merges it back into the module branch.',
        args: {
            merge: {
                description: 'Whether to merge the chapter branch. Can also be set at time of creation.',
                type: 'BOOL',
                named: true,
                hint: '[value_set_when_created]',
                optional: true,
            },
        },
        command({ merge }) {},
    },
    summarize: {
        description: 'Creates a summary of a chapter.',
        args: {
            onlyShowOnComplete: {
                description: 'Limit when a user can view the chapter summary.',
                type: 'BOOL',
                named: true,
                hint: '[true]',
                optional: true,
            },
        },
        command({ onlyShowOnComplete }) {},
    },
};
