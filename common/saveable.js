const { promises: fs, watch } = require('fs');
const path = require('path');

const directory = process.cwd();

async function ensureLearnitDirectory() {
    try {
        await fs.mkdir(path.join(directory, '.learnit'));
    } catch(e) {}
}

module.exports = class Saveable {
    constructor(name, defaultValue = {}) {
        this.file = path.join(directory, `.learnit/${name}.json`);
        this.listeners = [];
        this.locked = false;
        this.watching = false;
        this.hasFile = false;

        try {
            this.value = require(this.file);
            this.hasFile = true;
        } catch(e) {
            this.value = defaultValue;
        }
    }

    async save() {
        this.locked = true;
        if (!this.hasFile) await ensureLearnitDirectory();
        await fs.writeFile(this.file, JSON.stringify(this.value), 'utf-8');
        this.hasFile = true;
        this.locked = false;
    }

    async onSave(fn) {
        if (!this.hasFile) {
            await ensureLearnitDirectory();
            await fs.writeFile(this.file, JSON.stringify(this.value), 'utf-8');
        }

        if (!this.watching) {
            this.watching = true;
            watch(this.file, {}, async (event) => {
                if (event === 'change' && !this.locked) {
                    const content = (await fs.readFile(this.file)).toString();
                    this.value = JSON.parse(content);
                    this.listeners.forEach(fn => fn(this.value));
                }
            });
        }

        this.listeners.push(fn);

        return () => this.listeners.splice(this.listeners.indexOf(fn), 1);
    }
}
