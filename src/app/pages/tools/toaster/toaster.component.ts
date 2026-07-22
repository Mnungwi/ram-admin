import { Component, OnInit, VERSION, ViewEncapsulation } from '@angular/core';
import { ToastrService, GlobalConfig } from 'ngx-toastr';

interface Quote {
  title: string | null
  message: string | null
}

const quotes: Quote[] = [
  {
    title: 'Title',
    message: 'Message'
  },
  {
    title: '😃',
    message: 'Supports Emoji'
  },
  {
    title: null,
    message: 'My name is Inigo Montoya. You killed my father. Prepare to die!',
  },
  {
    title: null,
    message: 'Titles are not always needed'
  },
  {
    title: 'Title only 👊',
    message: null,
  },
  {
    title: '',
    message: `Supports Angular ${VERSION.full}`,
  },
];
const types: string[] = ['success', 'error', 'info', 'warning'];

@Component({
  selector: 'app-toaster',
  templateUrl: './toaster.component.html',
  encapsulation: ViewEncapsulation.None
})
export class ToasterComponent implements OnInit {
  options: GlobalConfig;
  title = '';
  type = types[0];
  message = '';
  version = VERSION;
  private lastInserted: number[] = [];
  constructor(public toastrService: ToastrService) { 
    this.options = this.toastrService.toastrConfig;
  }

  ngOnInit() {
    setTimeout(() => {
        this.toastrService.success('Welcome to toaster page!', 'Toastr fun!');
    });
  }

  openToast() {
    let m: string | null = this.message;
    let t: string | null = this.title;
    if (!this.title.length && !this.message.length) {
      const randomMessage = quotes[Math.floor(Math.random()*quotes.length)];
      m = randomMessage.message;
      t = randomMessage.title;
    }
    const opt = JSON.parse(JSON.stringify(this.options));
    const inserted = (this.toastrService as any)[this.type](m, t, opt);
    if (inserted) {
      this.lastInserted.push(inserted.toastId);
    }
    return inserted;
  }

  clearToasts() {
    this.toastrService.clear();
  }
  clearLastToast() {
    this.toastrService.clear(this.lastInserted.pop());
  }

}
