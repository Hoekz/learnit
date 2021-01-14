const gitFs = require('./git-fs');
module.exports = class Saveable {
    constructor(name, defaultValue = {}) {
        this.file = `.learnit/${name}.json`;
        this.listeners = [];
        this.locked = false;
        this.watching = false;
        this.hasFile = false;
        this.read = false;
        this.value = defaultValue;
        this.readFile();
    }

    async readFile() {
        try {
            this.value = JSON.parse(await gitFs.readFile(this.file));
            this.hasFile = true;
            this.notify();
        } catch (e) {
            await gitFs.mkdir('.learnit');
            await gitFs.writeFile(this.file, JSON.stringify(this.value), 'utf-8');
        }

        this.read = true;
        if (this.listeners.length) this.watch();
    }

    async save() {
        this.locked = true;
        if (!this.hasFile) await gitFs.mkdir('.learnit');
        await gitFs.writeFile(this.file, JSON.stringify(this.value), 'utf-8');
        this.hasFile = true;
        this.locked = false;
    }

    watch() {
        if (!this.watching) {
            this.watching = true;
            gitFs.watch(this.file, {}, async (event) => {
                if (event === 'change' && !this.locked) {
                    const content = (await gitFs.readFile(this.file)).toString();
                    this.value = JSON.parse(content);
                    this.notify();
                }
            });
        }
    }

    notify() {
        this.listeners.forEach(fn => fn(this.value));
    }

    async onSave(fn) {
        if (this.read && !this.hasFile) {
            await gitFs.mkdir('.learnit');
            await gitFs.writeFile(this.file, JSON.stringify(this.value), 'utf-8');
        }

        if (this.read) {
            this.watch();
        }

        this.listeners.push(fn);

        return () => this.listeners.splice(this.listeners.indexOf(fn), 1);
    }
}
