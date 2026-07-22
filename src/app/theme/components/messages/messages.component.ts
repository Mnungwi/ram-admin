import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {MessagesService} from './messages.service';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [ MessagesService ]
})
export class MessagesComponent implements OnInit {
  public messages: Array<any>;
  public files: Array<any>;
  public meetings: Array<any>;  
  constructor(private messagesService:MessagesService) { 
    this.messages = messagesService.getMessages();
    this.files = messagesService.getFiles();
    this.meetings = messagesService.getMeetings();
    
  }

  ngOnInit() {
    jQuery('#messagesTabs').on('click', '.nav-item a', function(){        
        setTimeout(() => jQuery(this).closest('.dropdown').addClass('show')); 
    })
  }

}
