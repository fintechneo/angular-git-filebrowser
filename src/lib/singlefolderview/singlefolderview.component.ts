import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { FileInfo, FileBrowserService } from '../filebrowser.service';

@Component({
  selector: 'app-singlefolderview',
  templateUrl: './singlefolderview.component.html',
  styleUrls: ['./singlefolderview.component.css']
})
export class SinglefolderviewComponent implements OnInit {

  @Input() path: string;

  fileList: Observable<FileInfo[]>;

  constructor(
    public filebrowserservice: FileBrowserService
  ) {

  }

  ngOnInit() {
    this.fileList = this.filebrowserservice.listendir(this.path);
  }

}
