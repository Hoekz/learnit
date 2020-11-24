const { fs: promises, watch } = require('fs');
const path = require('path');

const directory = process.cwd();

module.exports = class Saveable {
    constructor(name, defaultValue = {}) {
        this.file = path.join(directory, `.learnit/${name}.json`);
        this.listeners = [];
        this.locked = false;
        this.watching = false;

        try {
            this.value = require(this.file);
        } catch(e) {
            this.value = defaultValue;
        }
    }

    async save() {
        this.locked = true;
        await fs.writeFile(this.file, JSON.stringify(this.value), 'utf-8');
        this.locked = false;
    }

    onSave(fn) {
        if (!this.watching) {
            this.watching = true;
            watch(this.file, {}, async (event) => {
                if (event === 'change' && !this.locked) {
                    this.value = JSON.parse((await fs.readFile(this.file)).toString());
                    this.listeners.forEach(fn => fn(this.value));
                }
            });
        }

        this.listeners.push(fn);

        return () => this.listeners.splice(this.listeners.indexOf(fn), 1);
    }
}
