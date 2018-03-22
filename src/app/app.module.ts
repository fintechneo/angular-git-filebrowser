import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { FileBrowserModule, FileBrowserService } from '../lib/filebrowser.module';
import { FormsModule } from '@angular/forms';
import { GitBackendModule } from '../lib/gitbackend/gitbackend.module';
import { GitBackendService } from '../lib/gitbackend/gitbackend.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    FileBrowserModule,
    GitBackendModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {

  }
}
