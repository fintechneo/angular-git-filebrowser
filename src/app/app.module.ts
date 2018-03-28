import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { FileBrowserModule, FileBrowserService } from '../lib/filebrowser.module';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule, MatInputModule, MatButtonModule, MatCardModule } from '@angular/material';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatInputModule,
    MatCheckboxModule,
    MatCardModule,
    MatButtonModule,
    FormsModule,
    FileBrowserModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {

  }
}
