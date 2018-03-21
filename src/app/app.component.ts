import { Component } from '@angular/core';
import { GitBackendService } from './gitbackend/gitbackend.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  showfilebrowser = true;
  gitrepositoryurl = 'https://github.com/fintechneo/browsergittestdata.git';

  constructor(
    private gitbackendservice: GitBackendService
  ) {

  }

  clone() {
    this.gitbackendservice.clone(this.gitrepositoryurl);
  }
}
