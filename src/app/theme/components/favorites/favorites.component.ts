import { Component, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IMultiSelectOption, IMultiSelectSettings, IMultiSelectTexts } from 'ngx-bootstrap-multiselect';
import { MenuService } from '../menu/menu.service';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [ MenuService ]
})
export class FavoritesComponent {

    public favoriteModel: number[] = [];
    public favoriteSettings: IMultiSelectSettings = {
        enableSearch: true,
        checkedStyle: 'fontawesome',
        buttonClasses: 'btn btn-secondary btn-block',
        dynamicTitleMaxItems: 0,
        displayAllSelectedText: true
    };
    public favoriteTexts: IMultiSelectTexts = {
        checkAll: 'Select all',
        uncheckAll: 'Unselect all',
        checked: 'menu item selected',
        checkedPlural: 'menu items selected',
        searchPlaceholder: 'Find menu item...',
        defaultTitle: 'Select favorite menu items',
        allSelected: 'All selected',
    };
    public favoriteOptions: IMultiSelectOption[] = [];
    public menuItems:Array<any>;
    public toggle:boolean;
    public favorites:Array<any> = []; 

    constructor(public menuService:MenuService, public translateService: TranslateService) { 
      this.menuItems = this.menuService.getVerticalMenuItems().filter(menu => menu.routerLink != null || menu.href !=null);   
      this.menuItems.forEach(item=>{
        let menu = { 
          id: item.id, 
          name: this.translateService.instant(item.title),
          routerLink: item.routerLink, 
          href: item.href,
          icon: item.icon,
          target: item.target
        }
        this.favoriteOptions.push(menu);
      })

      const favorites = sessionStorage.getItem("favorites");  
      if (!favorites) {
        return;
      } 
    
      this.favorites = JSON.parse(favorites);
      this.favorites.forEach(favorite => {
        this.favoriteModel.push(favorite.id);
      })        
      
    }

    public onDropdownOpened(){
      this.toggle = true;
    }
    public onDropdownClosed(){
      this.toggle = false;
    }

    public onChange() {
      this.favorites.length = 0;
      this.favoriteModel.forEach(i => {
          let favorite = this.favoriteOptions.find(mail => mail.id === +i);
          this.favorites.push(favorite);
      });      
      sessionStorage.setItem("favorites", JSON.stringify(this.favorites));  
    }


}
