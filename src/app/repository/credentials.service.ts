import { Injectable } from '@angular/core';

@Injectable()
export class CredientialsService {
    username: string;
    password: string;
    gitname = 'Test';
    gitemail = 'test@example.com';
    proxyhost = 'http://localhost:4200';

    constructor() {
        try {
            const storedCredentials: CredientialsService =
                JSON.parse(sessionStorage.getItem('filebrowsersessioncredentials'));
            this.username = storedCredentials.username;
            this.password = storedCredentials.password;
            this.gitemail = storedCredentials.gitemail;
            this.gitname = storedCredentials.gitname;
            this.proxyhost = storedCredentials.proxyhost;
        } catch (e) {

        }
    }

    storeCredentialsInSessionStorage() {
        sessionStorage.setItem('filebrowsersessioncredentials', JSON.stringify(this));
    }
}
