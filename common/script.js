const path = require('path');
const { promises: fs } = require('fs');
const inquirer = require('inquirer');
const { getBranchConfig } = require('../cli/git-helpers');
const { unrecognized } = require('./errors');

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

function parseMarkdown(lines) {
    let level = 'module';
    let description = [];
    let i = 0;
    const script = { chapters: [] };
    let chapter = { steps: [] };
    let step = {};

    while (i < lines.length) {
        const line = lines[i];

        switch (level) {
            case 'module':
                if (!script.name && line.startsWith('# ')) {
                    script.name = line.replace('# ', '').trim();
                    break;
                }

                if (line.startsWith('## ')) {
                    script.description = description.join('\n').trim();
                    description = [];
                    level = 'chapter';
                    continue;
                }

                description.push(line);

                break;
            case 'chapter':
                if (line.startsWith('## ')) {
                    if (!chapter.name) {
                        chapter.name = line.replace('## ', '').trim();
                        break;
                    } else {
                        script.chapters.push(chapter);
                        chapter = { steps: [] };
                        continue;
                    }
                }

                if (line.startsWith('### ')) {
                    chapter.description = description.join('\n').trim();
                    description = [];
                    level = 'step';
                    continue;
                }

                description.push(line);

                break;
            case 'step':
                if (line.startsWith('## ')) {
                    step.description = description.join('\n').trim();
                    description = [];
                    chapter.push(step);
                    step = {};
                    level = 'chapter';
                    continue;
                }

                if (line.startsWith('### ')) {
                    if (!step.name) {
                        step.name = line.replace('### ', '');

                        if (/^Step \d+$/.test(step.name)) {
                            step.name = step.name.replace('Step ', '');
                        }

                        break;
                    } else {
                        step.description = description.join('\n').trim();
                        description = [];
                        chapter.steps.push(step);
                        step = {};
                        continue;
                    }
                }

                description.push(line);

                break;
        }

        i++;
    }

    if (step.name) {
        step.description = description.join('\n').trim();
        description = [];
        chapter.steps.push(step);
    }

    if (chapter.name) {
        chapter.description = chapter.description || description.join('\n').trim();
        description = [];
        script.chapters.push(chapter);
    }

    if (description.length) {
        script.description = description.join('\n').trim();
    }

    return script;
}

async function read({ value }) {
    const { cwd } = await getBranchConfig(value);
    const script = cwd ? path.join(cwd, value + '.md') : value + '.md';

    const lines = (await fs.readFile(script, 'utf-8')).toString().split('\n');

    return parseMarkdown(lines);
}

async function write({ value, name }, { description, chapters = [] }) {
    const { cwd } = await getBranchConfig(value);
    const script = cwd ? path.join(cwd, value + '.md') : value + '.md';

    let body = `# ${name.trim()}\n\n${description.trim()}\n`;

    chapters.forEach((chapter) => {
        body += `\n## ${chapter.name.trim()}\n\n${chapter.description.trim()}\n`;

        chapter.steps.forEach((step) => {
            body += `\n### ${step.name.trim()}\n\n${step.description.trim()}\n`;
        });
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
        script.chapters.push({ name, description, steps: [] });
    }

    await write(module, script);
}

async function addStep(module, chapter, name, description) {
    const script = await read(module);

    name = /^\d+$/.test(name) ? `Step ${name}` : name;

    const existingChapter = script.chapters.find(c => c.name === chapter.name);

    if (!existingChapter) {
        unrecognized.chapter(chapter.name);
    }

    existingChapter.steps.push({ name, description });

    await write(module, script);
}

module.exports = {
    scriptFor,
    read, write,
    setChapter,
    addStep,
};
