import { Pipe, PipeTransform } from '@angular/core';
import { Mail } from 'src/app/pages/mailbox/mailbox.service';

@Pipe({
  name: 'MailSearch'
})

export class MailSearchPipe implements PipeTransform { 
  transform(value: Mail[] | null, args?: string): Mail[] | null {
    if (!value || !args) {
      return value;
    } 
    const searchText = new RegExp(args, 'ig');
    return value.filter(mail => {
      return (mail.sender && mail.sender.search(searchText) !== -1) ||
             (mail.subject && mail.subject.search(searchText) !== -1);
    });
  }
}
