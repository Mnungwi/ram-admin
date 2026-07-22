import { Component, OnInit, ViewEncapsulation, HostListener } from '@angular/core';
import { AppSettings } from '../../../app.settings';
import { Settings } from '../../../app.settings.model';
import { MenuService } from '../menu/menu.service';
import { Menu } from '../menu/menu.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [ MenuService ]
})
export class SidebarComponent implements OnInit {  
  public settings: Settings;
  public menuItems: Array<Menu>;
  constructor(public appSettings:AppSettings, public menuService:MenuService) {
      this.settings = this.appSettings.settings;
      this.menuItems = this.menuService.getVerticalMenuItems();
  }

  ngOnInit() {  
    const userMenuItems = sessionStorage.getItem("userMenuItems");  
    if (!userMenuItems) {
      return;
    } 
    let ids: number[] = JSON.parse(userMenuItems);
    let newArr: Menu[] = [];
    ids.forEach((id: number) => {
      let newMenuItem: Menu = this.menuItems.find((menu: Menu) => menu.id == id)!;
      newArr.push(newMenuItem);
    });
    this.menuItems = newArr;    
  }

  public closeSubMenus(){
    const menu = document.querySelector("#menu0");
    if (!menu) {
      return;
    }
    for (let i = 0; i < menu.children.length; i++) {
      let child = menu.children[i].children[1]; 
      if(child){
        if(child.classList.contains('show')){
          child.classList.remove('show');
          menu.children[i].children[0].classList.add('collapsed'); 
        }             
      }
    }
  } 

}
