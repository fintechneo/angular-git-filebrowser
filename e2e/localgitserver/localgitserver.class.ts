/**
 * This example will create a git http server to a repository on your local disk.
 * Modify GIT_PROJECT_ROOT below to change the loction of your git repositories.
 */

import { Server, createServer } from 'http';
import { existsSync, readFileSync, mkdirSync, createWriteStream, exists } from 'fs';
import * as cgi from 'cgi';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

const logger = createWriteStream('gitserver.log');

function log(line) {
    logger.write(line + '\n');
}

const projectRoot = `${tmpdir()}/localgitserver`;

const script = 'git';
const gitcgi = cgi(script, {
    args: ['http-backend'],
    stderr: process.stderr,
    env: {
        'GIT_PROJECT_ROOT': projectRoot,
        'GIT_HTTP_EXPORT_ALL': '1',
        'REMOTE_USER': 'hello@blabla.no' // Push requires authenticated users by default
    }
});

export class LocalGitServer {
    server: Server;

    expectedLogLines: {[line: string]: boolean} = {};

    start() {

        execSync(`rm -Rf ${projectRoot}`);
        mkdirSync(`${projectRoot}`);

        this.server = createServer((request, response) => {
            const path = request.url.substring(1);
            const organization = path.split('/')[0];
            const repo  = path.split('/')[1].split('?')[0];

            const logline = `${request.method} ${request.url}`;
            if(this.expectedLogLines[logline] !== undefined) {
                this.expectedLogLines[logline] = true;
            }

            log(request.method + ' ' + request.url);

            if (!existsSync(`${projectRoot}/${organization}`)) {
                mkdirSync(`${projectRoot}/${organization}`);
            }

            if (!existsSync(`${projectRoot}/${path}`)) {
                execSync(`git init --bare ${projectRoot}/${organization}/${repo}`);
            }

            gitcgi(request, response);
        }).listen(15000);
    }

    addLogExpectation(logline: string) {
        this.expectedLogLines[logline] = false;
    }

    areLogExpectationsMet(): boolean {
        return Object.keys(this.expectedLogLines).reduce((prev, nextKey) =>
            prev && this.expectedLogLines[nextKey], true);
    }

    gitLog(organization: string, repo: string): string {
        return '' + execSync(`cd ${projectRoot}/${organization}/${repo} && git log --name-only`);

    }

    stop() {
        this.server.close();
        logger.end('\n');
        logger.close();
    }
}
