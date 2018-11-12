import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CredientialsService } from './credentials.service';

@Component({
    templateUrl: 'selectrepository.component.html'
})
export class SelectRepositoryComponent {
    workdir = 'workdir';
    gitrepositoryurl = 'https://github.com/fintechneo/browsergittestdata.git';

    constructor(
        private router: Router,
        public credentialsService: CredientialsService
    ) {

    }
    open() {
        this.router.navigate(['/', this.workdir], {
            queryParams: {
                cloneurl: this.gitrepositoryurl
            }
        });
    }
}
