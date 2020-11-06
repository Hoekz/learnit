
module.exports = {
    create: {
        description: 'Creates a new module for the course.',
        args: {
            moduleBranchOrName: {
                description: 'The branch or name to use for the module',
                type: 'STR',
                named: false,
                optional: false,
            },
            name: {
                description: 'If you need to specify both branch and name, use this arg.',
                type: 'STR',
                named: true,
                hint: '<module_name>',
                optional: true,
            }
        },
        command({ moduleBranchOrName, name }) {},
    },
    summarize: {
        description: 'Creates a summary of a module. Defaults to summarizing all chapters.',
        args: {
            chapters: {
                description: 'Chapters to summarize.',
                type: 'STR[]',
                named: true,
                hint: '<c1>,<c2>',
                optional: true,
            },
            onlyShowOnComplete: {
                description: 'Only allow the user to select the summary after completing the module.',
                type: 'BOOL',
                named: true,
                hint: 'true',
                optional: true,
            },
        },
        command({ chapters, onlyShowOnComplete }) {},
    },
}
