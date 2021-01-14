const { spawn } = require('child_process');
const colors = require('colors');
const { getModule, chapterFrom, stepFrom } = require("../cli/git-helpers");

const colorTable = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'gray'].map(c => colors[c]);

const hash = (str) => colorTable[str.split('').reduce((n, c) => (n * 59 + c.charCodeAt()) % colorTable.length, str.length)];

module.exports = class Command {
    constructor({ run, refresh, cwd, prefix, module, chapter, step }) {
        this.run = run;
        this.refresh = refresh;
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
        this.process = spawn(this.run, {
            cwd: this.cwd,
            shell: true,
            maxBuffer: 5 * Math.pow(2, 20),
            windowsHide: true,
        });
        this.running = true;
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
        const lines = data.toString().split('\n');
        const last = lines.pop();
        const withPrefix = lines.map(line => `${this.prefix} ${line}`).join('\n') + (last ? `${this.prefix} ${last}` : '\n');

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
