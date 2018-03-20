import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { FileBrowserModule } from '../lib/filebrowser.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    FileBrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
