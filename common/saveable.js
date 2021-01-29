const gitFs = require('./git-fs');

const ensureLearnitDir = () => {
    if (ensureLearnitDir.promise) {
        return ensureLearnitDir.promise;
    }
    
    return ensureLearnitDir.promise = gitFs.mkdir('.learnit').catch(e => e);
};

const settler = (interval = 0) => {
    let resolve;
    let shouldWait = false;
    let promise = new Promise(res => resolve = res);

    const shouldResolve = () => {
        if (shouldWait) {
            shouldWait = false;
            setTimeout(shouldResolve, interval);
        }

        resolve();
    }

    setTimeout(shouldResolve, interval);

    return {
        stir: () => shouldWait = true,
        done: promise,
    }
};

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
        if (!await gitFs.isGitRepo()) {
            return;
        }

        try {
            this.value = JSON.parse(await gitFs.readFile(this.file));
            this.hasFile = true;
            this.notify();
        } catch (e) {
            await ensureLearnitDir();
            await gitFs.writeFile(this.file, JSON.stringify(this.value), 'utf-8');
        }

        this.read = true;
        if (this.listeners.length) this.watch();
    }

    async save() {
        this.locked = true;
        if (!this.hasFile) await ensureLearnitDir();
        await gitFs.writeFile(this.file, JSON.stringify(this.value), 'utf-8');
        this.hasFile = true;
        this.locked = false;
    }

    watch() {
        if (!this.watching) {
            this.watching = true;
            let unstable;
            gitFs.watch(this.file, {}, async (event) => {
                if (event === 'change' && !this.locked) {
                    unstable = unstable || settler();
                    unstable.stir();

                    await unstable.done;

                    const content = (await gitFs.readFile(this.file)).toString();
                    this.value = JSON.parse(content);
                    this.notify();
                    unstable = null;
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
