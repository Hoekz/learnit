const { spawn } = require('child_process');
const colors = require('colors');
const { getModule, chapterFrom, stepFrom } = require('../cli/git-helpers');
const Saveable = require('../common/saveable');

const commandHistory = new Saveable('command-history', {});

function hasRun({ run, module, chapter, step }) {
    let readAt = commandHistory.value;

    if (module) {
        readAt = readAt[module] = readAt[module] || {};
    }

    if (chapter) {
        readAt = readAt[chapter] = readAt[chapter] || {};
    }

    if (step) {
        readAt = readAt[step] = readAt[step] || {};
    }
    
    return run in readAt;
}

async function updateRunCount({ run, module, chapter, step }) {
    let setAt = commandHistory.value;

    if (module) {
        setAt = setAt[module] = setAt[module] || {};
    }

    if (chapter) {
        setAt = setAt[chapter] = setAt[chapter] || {};
    }

    if (step) {
        setAt = setAt[step] = setAt[step] || {};
    }
    
    setAt[run] = (setAt[run] || 0) + 1;
    await commandHistory.save();
}

const colorTable = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'gray'].map(c => colors[c]);

const hash = (str) => colorTable[str.split('').reduce((n, c) => (n * 59 + c.charCodeAt()) % colorTable.length, str.length)];

module.exports = class Command {
    constructor({ run, refresh, silent, once, cwd, prefix, module, chapter, step }) {
        this.run = run;
        this.refresh = refresh;
        this.silent = silent;
        this.once = once;
        this.cwd = cwd;

        this.module = module;
        this.chapter = chapter;
        this.step = step;
        this.rawPrefix = prefix || step || chapter || module;
        this.prefix = hash(this.run)(`[${this.rawPrefix}]`);

        this.running = false;
        this.process = null;
        this.killing = false;

        this.log = this.log.bind(this);
    }

    async matches({ module, chapter, step }) {
        if (this.running && this.refresh) {
            return false;
        }

        if (!this.module) {
            return true;
        }

        const matchModule = module === (await getModule(this.module)).name;

        if (!this.chapter || !matchModule) {
            return matchModule;
        }

        const matchChapter = chapter === (await chapterFrom(this.module)(this.chapter)).name;

        if (!this.step || !matchChapter) {
            return matchChapter;
        }

        return step === (await stepFrom(this.module, this.chapter, this.step)).message.replace(/^step: /, '');
    }

    async start() {
        await commandHistory.ready;

        if (this.once && hasRun(this)) {
            return;
        }

        await updateRunCount(this);
        
        this.process = spawn(this.run, {
            cwd: this.cwd,
            shell: true,
            maxBuffer: 5 * Math.pow(2, 20),
            windowsHide: true,
        });
        this.running = true;
        this.emptyLine = true;

        console.log(`Command Starting: ${hash(this.run)(this.run)}`);

        this.process.on('error', (err) => {
            this.running = false;
            this.process = null;
            console.log(`Failed to start: ${hash(this.run)(this.run)}`);
            console.log(`Reason: ${err}`);
        });

        this.process.stdout.on('data', this.log);
        this.process.stderr.on('data', this.log);

        this.process.on('close', (code) => {
            this.running = false;
            this.process = null;
            if (!this.killing) {
                console.log(`Exited with code ${code}: ${hash(this.run)(this.run)}`);
            }
            this.killing = false;
        });
    }

    log(data) {
        if (this.silent) {
            return;
        }

        let str = data.toString();

        if (!str.includes('\n') && !this.emptyLine) {
            process.stdout.write(str);
            return;
        }

        if (/^[ \t\v\f]*\n/.test(str) && !this.emptyLine) {
            process.stdout.write('\n');
            str = str.replace(/^[ \t\v\f]*\n/, '');
            if (!str) return;
        }

        const lines = str.split('\n');
        const last = lines.pop();
        const withPrefix = lines.map(line => `${this.prefix} ${line}`).join('\n') + (last ? `${this.prefix} ${last}` : '\n');

        this.emptyLine = !last || last === '\n';

        process.stdout.write(withPrefix);
    }

    async stop() {
        if (this.running) {
            this.killing = true;
            this.running = false;
            this.process.kill();
        }
    }
}
