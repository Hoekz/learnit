const simpleGit = require('simple-git');
const colors = require('colors');
const { moduleToBranch } = require('../common/utils');
const git = simpleGit();

const DIFF_BETWEEN = Symbol.for('DIFF_BETWEEN');
const DIFF_INDEX = Symbol.for('DIFF_INDEX');
const DIFF_FROM_FILE = Symbol.for('DIFF_FROM_FILE');
const DIFF_TO_FILE = Symbol.for('DIFF_TO_FILE');
const DIFF_BLOCK = Symbol.for('DIFF_BLOCK');
const DIFF_UNCHANGED_LINE = Symbol.for('DIFF_UNCHANGED_LINE');
const DIFF_NEW_LINE = Symbol.for('DIFF_NEW_LINE');
const DIFF_DEL_LINE = Symbol.for('DIFF_DEL_LINE');

const lineType = (line, lastType) => {
    switch (line[0]) {
        case 'd': return DIFF_BETWEEN;
        case 'i': return DIFF_INDEX;
        case '@': return DIFF_BLOCK;
        case ' ': return DIFF_UNCHANGED_LINE;
        case '+':
            if (line.startsWith('+++') && lastType === DIFF_FROM_FILE) return DIFF_TO_FILE;
            else return DIFF_NEW_LINE;
        case '-':
            if (line.startsWith('---') && lastType === DIFF_INDEX) return DIFF_FROM_FILE;
            else return DIFF_DEL_LINE;
    }
};

const parseBetween = (line) => line.replace('diff --git ', '').split(' ').map((file) => file.split('/').slice(1).join('/'));

const parseDiffBlock = (line) => line.split('@@')[2].substr(1);

const parseFile = (lines) => {
    let lastType = null;

    const file = {
        name: '',
        deleted: false,
        new: false,
        rename: false,
        oldName: '',
        deltas: [],
        lines: [],
    };
    let delta = null;

    for (line of lines) {
        const type = lineType(line, lastType);

        if (type === DIFF_BETWEEN) {
            if (file.name) break;

            [file.oldName, file.name] = parseBetween(line);
            if (file.oldName !== file.name) {
                file.rename = true;
            }
        }

        if ([DIFF_INDEX, DIFF_FROM_FILE, DIFF_TO_FILE].includes(type)) {
            // do nothing right now
        }

        if (type === DIFF_BLOCK) {
            if (delta) file.deltas.push(delta);

            delta = { lines: [parseDiffBlock(line)] };
        }

        if (type === DIFF_UNCHANGED_LINE) delta.lines.push(line.substr(1));
        if (type === DIFF_NEW_LINE) delta.lines.push(colors.green(line.substr(1)));
        if (type === DIFF_DEL_LINE) delta.lines.push(colors.red(line.substr(1)));

        lastType = type;
        file.lines.push(line);
    }
    if (delta) file.deltas.push(delta);

    return file;
};

const parseDiff = (str) => {
    const lines = str.split('\n');
    const files = [];

    while (lines.length) {
        const file = parseFile(lines);
        lines.splice(0, file.lines.length);
        files.push(file);
    }

    return files;
};

module.exports = async (state) => {    
    console.clear();
    
    if (!state.step) {
        console.log('No information to show.');
        return;
    }
    
    // TODO: determine if diff should be calculated.
    const diff = await git.diff([`${state.commit}^!`]);

    console.log(`Updated at ${(new Date()).toLocaleTimeString()}`);

    return parseDiff(diff).filter(file => {
        return !file.name.endsWith(`${moduleToBranch(state.module)}.md`);
    }).forEach(file => {
        console.log('='.repeat(80));
        console.log(file.rename
            ? `${colors.red(file.oldName)} -> ${colors.green(file.name)}`
            : colors.blue(file.name)
        );
        file.deltas.forEach(group => {
            console.log('-'.repeat(80));
            group.lines.forEach(line => console.log(line));
        });
    });
};
