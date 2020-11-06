const { getState } = require('../common/course');

module.exports = {
    create: {
        description: 'Initializes a course. If you are already in a git repo, it will be used.',
        args: {},
        command() {},
    },
    summarize: {
        description: 'Creates a summary of the course.',
        args: {
            modules: {
                description: 'List of modules to summarize.',
                type: 'STR[]',
                named: true,
                hint: '<m1>,<m2>',
                optional: true,
            },
            onlyShowOnComplete: {
                description: 'Whether to allow the user to select the summary before course is completed.',
                type: 'BOOL',
                named: true,
                hint: '[true]',
                optional: true,
            },
        },
        command({ modules, onlyShowOnComplete }) {}
    }
};
