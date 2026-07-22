import { Component, ViewEncapsulation } from '@angular/core';
import { AppSettings } from '../../../app.settings';
import { Settings } from '../../../app.settings.model';

@Component({
  selector: 'app-info-panels',
  templateUrl: './info-panels.component.html',
  encapsulation: ViewEncapsulation.None
})
export class InfoPanelsComponent {
  
  public sales: any[] = [{ name:'sales', value:0.81, extra: { format: 'percent' } }];
  public salesBgColor: any = { domain: ['#2F3E9E'] };

  public likes: any[] = [{ name:'likes', value:47588 }];
  public likesBgColor: any = { domain: ['#D22E2E'] };

  public downloads: any[] = [{ name:'downloads', value:189730 }];
  public downloadsBgColor: any = { domain: ['#378D3B'] };

  public profit: any[] = [{ name:'profit', value:52470, extra: { format: 'currency' } }];
  public profitBgColor: any = { domain: ['#0096A6'] };

  public messages: any[] = [{ name:'messages', value:75296 }];
  public messagesBgColor: any = { domain: ['#606060'] };

  public members: any[] = [{ name:'members', value:216279 }];
  public membersBgColor: any = { domain: ['#F47B00'] };


  public infoLabelFormat(c: any): string {
    switch(c.data.name) {
      case 'sales':
        return `<i class="fa fa-shopping-cart mr-2"></i>${c.label}`;
      case 'likes':
        return `<i class="fa fa-thumbs-o-up mr-2"></i>${c.label}`;
      case 'downloads':
        return `<i class="fa fa-download mr-2"></i>${c.label}`;
      case 'profit':
        return `<i class="fa fa-money mr-2"></i>${c.label}`;
      case 'messages':
        return `<i class="fa fa-comment-o mr-2"></i>${c.label}`;
      case 'members':
        return `<i class="fa fa-user mr-2"></i>${c.label}`;
      default:
        return c.label;
    }
  }

  public infoValueFormat(c: any): string {
    switch(c.data.extra ? c.data.extra.format : '') {
      case 'currency':
        return `\$${Math.round(c.value).toLocaleString()}`;
      case 'percent':
        return `${Math.round(c.value * 100)}%`;
      default:
        return c.value.toLocaleString();
    }
  }

  public previousShowMenuOption:boolean;
  public previousMenuOption:string;
  public previousMenuTypeOption:string;
  public settings: Settings;
  constructor(public appSettings:AppSettings) {    
    this.settings = this.appSettings.settings;
    this.initPreviousSettings();
  }

  public onSelect(event: any) {
    console.log(event);
  }



  public ngDoCheck() {
    if(this.checkAppSettingsChanges()) {
      setTimeout(() => this.sales = [...this.sales] ); 
      setTimeout(() => this.likes = [...this.likes] ); 
      setTimeout(() => this.downloads = [...this.downloads] ); 
      setTimeout(() => this.profit = [...this.profit] ); 
      setTimeout(() => this.messages = [...this.messages] ); 
      setTimeout(() => this.members = [...this.members] ); 
      this.initPreviousSettings();
    }
  }

  public checkAppSettingsChanges(){
    if(this.previousShowMenuOption != this.settings.theme.showMenu ||
      this.previousMenuOption != this.settings.theme.menu ||
      this.previousMenuTypeOption != this.settings.theme.menuType){
      return true;
    }
    return false;
  }

  public initPreviousSettings(){
    this.previousShowMenuOption = this.settings.theme.showMenu;
    this.previousMenuOption = this.settings.theme.menu;
    this.previousMenuTypeOption = this.settings.theme.menuType;
  }

}
