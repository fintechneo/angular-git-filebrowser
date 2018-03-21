import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { FileBrowserModule } from '../lib/filebrowser.module';
import { FormsModule } from '@angular/forms';
import { GitBackendModule } from './gitbackend/gitbackend.module';
import { GitBackendService } from './gitbackend/gitbackend.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    FileBrowserModule,
    GitBackendModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(gitbackend: GitBackendService) {

  }
}
