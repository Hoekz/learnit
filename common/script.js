const path = require('path');
const { promises: fs } = require('fs');
const inquirer = require('inquirer');
const { getBranchConfig } = require('../cli/git-helpers');

async function scriptFor(target) {
    const { value } = await inquirer.prompt({
        type: 'editor',
        name: 'value',
        message: `Provide a short description for ${target}.`,
        validate(text) {
            return text.length ? true : 'A description must be provided.';
        },
    });

    return value;
}

async function read({ value }) {
    const { cwd } = await getBranchConfig(value);
    const script = cwd ? path.join(cwd, value + '.md') : value + '.md';

    const lines = (await fs.readFile(script, 'utf-8')).toString().split('\n');

    const titleIndex = lines.findIndex(line => line.startsWith('# '));
    const descIndex = lines.slice(titleIndex + 1).findIndex(line => line);
    const firstChapterIndex = lines.findIndex(line => line.startsWith('## '));
    let description = lines.slice(descIndex, firstChapterIndex).join('\n');

    if (!description || description.startsWith('#')) {
        description = '';
    }

    const chapters = [];

    const lastChapter = lines.slice(firstChapterIndex).reduce((chapter, line) => {
        if (!chapter.name) {
            if (line.startsWith('## ')) {
                return { name: line.replace(/^## /, ''), description: '' };
            }

            return chapter;
        }

        if (!line.trim()) {
            return chapter;
        }

        if (line.startsWith('## ')) {
            chapters.push(chapter);
            return { name: line.replace(/^## /, ''), description: '' };
        }

        return { ...chapter, description: chapter.description + '\n' + line };
    }, {});

    if (lastChapter.name) {
        chapters.push(lastChapter);
    }

    return { description, chapters };
}

async function write({ value, name }, { description, chapters = [] }) {
    const { cwd } = await getBranchConfig(value);
    const script = cwd ? path.join(cwd, value + '.md') : value + '.md';

    let body = `# ${name.trim()}\n\n${description.trim()}\n`;

    chapters.forEach((chapter) => {
        body += `\n## ${chapter.name.trim()}\n\n${chapter.description.trim()}\n`;
    });
    
    await fs.writeFile(script, body, 'utf-8');
}

async function setChapter(module, name, description) {
    const script = await read(module);

    name = /^\d+$/.test(name) ? `Chapter ${name}` : name;

    const existing = script.chapters.find(chapter => chapter.name === name);

    if (existing) {
        existing.description = description;
    } else {
        script.chapters.push({ name, description });
    }

    await write(module, script);
}

module.exports = {
    scriptFor,
    read, write,
    setChapter,
};
