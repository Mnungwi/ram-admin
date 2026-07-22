import { Injectable, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Menu } from './menu.model';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { verticalMenuItems } from './menu';
import { horizontalMenuItems } from './menu';
@Injectable()
export class MenuService implements OnInit {
  private apiUrl = 'http://localhost:3000/api/menu'; // URL to fetch menu data
  public verticalMenuItems: Menu[] = [];
  public horizontalMenuItems: Menu[] = [];
  constructor(
    private location: Location,
    private renderer2: Renderer2,
    private router: Router,
    public translateService: TranslateService,
    private http: HttpClient // Inject HttpClient
  ) {

  }
  ngOnInit(): void {}

  fetchMenuItems(): Observable<{ data: Menu[] }> {
    return this.http.get<{ data: Menu[] }>(`${this.apiUrl}`).pipe(
      tap((response) => {
        this.verticalMenuItems = response.data;
        this.horizontalMenuItems = response.data;
      }),
      catchError((error) => {
        console.error('Failed to fetch menu items:', error);
        return of({ data: [] }); // Provide a fallback value
      })
    );
  }

  getMenuItems(): Observable<Menu[]> {
    return this.fetchMenuItems().pipe(
        map(response => response.data)  // Assuming your API response has a "data" field
    );
}
  // Refactored getVerticalMenuItems to return an Observable<Menu[]>
//   getVerticalMenuItems(): Observable<Menu[]> {
//     return this.getMenuItems();  // Simply return the observable from getMenuItems
// }

  getHorizontalMenuItems(): Observable<Menu[]> {

    return this.getMenuItems();
  }
  public getVerticalMenuItems():Observable<Menu[]> {
    return this.getMenuItems();
  }

  // getVerticalMenuItems(): Observable<Menu[]> {
  //   return this.http.get<Menu[]>(this.apiUrl); // Replace with your actual endpoint
  // }
  //getVerticalMenuItems(): Observable<Menu[]> {
    //return of([
       //     {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 1,
  //       "title": "dashboard",
  //       "href": null,
  //       "icon": "home",
  //       "routerLink": "/",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 0
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 2,
  //       "title": "membership",
  //       "href": null,
  //       "icon": "users",
  //       "routerLink": "/membership",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 0
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 3,
  //       "title": "Locations",
  //       "href": null,
  //       "icon": "map-marker",
  //       "routerLink": null,
  //       "target": null,
  //       "hasSubMenu": true,
  //       "parentId": 0
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 8,
  //       "title": "organization",
  //       "href": null,
  //       "icon": "building",
  //       "routerLink": null,
  //       "target": null,
  //       "hasSubMenu": true,
  //       "parentId": 0
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 12,
  //       "title": "User Management",
  //       "href": null,
  //       "icon": "user",
  //       "routerLink": "/user-management",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 0
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 13,
  //       "title": "Reports",
  //       "href": null,
  //       "icon": "file-text",
  //       "routerLink": null,
  //       "target": null,
  //       "hasSubMenu": true,
  //       "parentId": 0
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 16,
  //       "title": "Orders",
  //       "href": null,
  //       "icon": "shopping-cart",
  //       "routerLink": "/orders",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 0
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 17,
  //       "title": "Products",
  //       "href": null,
  //       "icon": "gift",
  //       "routerLink": "/products",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 0
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 18,
  //       "title": "Settings",
  //       "href": null,
  //       "icon": "cogs",
  //       "routerLink": "/settings",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 0
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 19,
  //       "title": "Support",
  //       "href": null,
  //       "icon": "headphones",
  //       "routerLink": "/support",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 0
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 20,
  //       "title": "Logout",
  //       "href": null,
  //       "icon": "sign-out-alt",
  //       "routerLink": "/logout",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 0
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 6,
  //       "title": "States",
  //       "href": null,
  //       "icon": "map-marker",
  //       "routerLink": "/states",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 3
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 7,
  //       "title": "Cities",
  //       "href": null,
  //       "icon": "map",
  //       "routerLink": "/cities",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 3
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 9,
  //       "title": "Company",
  //       "href": null,
  //       "icon": "building",
  //       "routerLink": "/company",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 8
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 10,
  //       "title": "Department",
  //       "href": null,
  //       "icon": "folder",
  //       "routerLink": "/department",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 8
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 11,
  //       "title": "Employees",
  //       "href": null,
  //       "icon": "users",
  //       "routerLink": "/employees",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 8
  //   },
  //   {
  //       "created_at": "26-11-2024",
  //       "updated_at": "26-11-2024",
  //       "id": 14,
  //       "title": "Sales Report",
  //       "href": null,
  //       "icon": "bar-chart",
  //       "routerLink": "/sales-report",
  //       "target": null,
  //       "hasSubMenu": false,
  //       "parentId": 13
  //   },
    //]);
 // }
  public createMenu(menu: Array<Menu>, nativeElement: any, type: string) {
    if (type == 'vertical') {
      this.createVerticalMenu(menu, nativeElement);
    }
    if (type == 'horizontal') {
      this.createHorizontalMenu(menu, nativeElement);
    }
  }

  public createVerticalMenu(menu: Array<Menu>, nativeElement: any) {
    let menu0 = this.renderer2.createElement('div');
    this.renderer2.setAttribute(menu0, 'id', 'menu0');
    menu.forEach((menuItem) => {
      if (menuItem.parentId == 0) {
        let subMenu = this.createVerticalMenuItem(menu, menuItem);
        this.renderer2.appendChild(menu0, subMenu);
      }
    });
    this.renderer2.appendChild(nativeElement, menu0);
  }

  public createHorizontalMenu(menu: Array<Menu>, nativeElement: any) {
    let nav = this.renderer2.createElement('div');
    this.renderer2.setAttribute(nav, 'id', 'navigation');
    let ul = this.renderer2.createElement('ul');
    this.renderer2.addClass(ul, 'menu');
    this.renderer2.appendChild(nav, ul);
    menu.forEach((menuItem) => {
      if (menuItem.parentId == 0) {
        let subMenu = this.createHorizontalMenuItem(menu, menuItem);
        this.renderer2.appendChild(ul, subMenu);
      }
    });
    this.renderer2.appendChild(nativeElement, nav);
  }

  public createVerticalMenuItem(menu: Array<Menu>, menuItem: any) {
    let div = this.renderer2.createElement('div');
    this.renderer2.addClass(div, 'card');
    this.renderer2.setAttribute(div, 'id', 'menu' + menuItem.id);
    let link = this.renderer2.createElement('a');
    this.renderer2.addClass(link, 'menu-item-link');
    this.renderer2.setAttribute(link, 'data-toggle', 'tooltip');
    this.renderer2.setAttribute(link, 'data-placement', 'right');
    this.renderer2.setAttribute(link, 'data-animation', 'false');
    this.renderer2.setAttribute(
      link,
      'data-container',
      '.vertical-menu-tooltip-place'
    );
    this.renderer2.setAttribute(
      link,
      'data-original-title',
      this.translateService.instant(menuItem.title)
    );
    let icon = this.renderer2.createElement('i');
    this.renderer2.addClass(icon, 'fa');
    this.renderer2.addClass(icon, 'fa-' + menuItem.icon);
    this.renderer2.appendChild(link, icon);
    let span = this.renderer2.createElement('span');
    this.renderer2.addClass(span, 'menu-title');
    this.renderer2.appendChild(link, span);
    let menuText = this.renderer2.createText(
      this.translateService.instant(menuItem.title)
    );
    this.renderer2.appendChild(span, menuText);
    this.renderer2.setAttribute(link, 'id', 'link' + menuItem.id);
    this.renderer2.addClass(link, 'transition');
    this.renderer2.appendChild(div, link);
    if (menuItem.routerLink) {
      this.renderer2.listen(link, 'click', () => {
        this.router.navigate([menuItem.routerLink]);
        this.setActiveLink(menu, link);
        this.closeOtherSubMenus(div);
      });
    }
    if (menuItem.href) {
      this.renderer2.setAttribute(link, 'href', menuItem.href);
    }
    if (menuItem.target) {
      this.renderer2.setAttribute(link, 'target', menuItem.target);
    }
    if (menuItem.hasSubMenu) {
      this.renderer2.addClass(link, 'collapsed');
      let caret = this.renderer2.createElement('b');
      this.renderer2.addClass(caret, 'fa');
      this.renderer2.addClass(caret, 'fa-angle-up');
      this.renderer2.appendChild(link, caret);
      this.renderer2.setAttribute(link, 'data-toggle', 'collapse');
      this.renderer2.setAttribute(link, 'href', '#collapse' + menuItem.id);
      let collapse = this.renderer2.createElement('div');
      this.renderer2.setAttribute(collapse, 'id', 'collapse' + menuItem.id);
      this.renderer2.setAttribute(
        collapse,
        'data-parent',
        '#menu' + menuItem.parentId
      );
      this.renderer2.addClass(collapse, 'collapse');
      this.renderer2.appendChild(div, collapse);
      this.createSubMenu(menu, menuItem.id, collapse, 'vertical');
    }
    return div;
  }

  public createHorizontalMenuItem(menu: Array<Menu>, menuItem: any) {
    let li = this.renderer2.createElement('li');
    this.renderer2.addClass(li, 'menu-item');
    let link = this.renderer2.createElement('a');
    this.renderer2.addClass(link, 'menu-item-link');
    this.renderer2.setAttribute(link, 'data-toggle', 'tooltip');
    this.renderer2.setAttribute(link, 'data-placement', 'top');
    this.renderer2.setAttribute(link, 'data-animation', 'false');
    this.renderer2.setAttribute(
      link,
      'data-container',
      '.horizontal-menu-tooltip-place'
    );
    this.renderer2.setAttribute(
      link,
      'data-original-title',
      this.translateService.instant(menuItem.title)
    );
    let icon = this.renderer2.createElement('i');
    this.renderer2.addClass(icon, 'fa');
    this.renderer2.addClass(icon, 'fa-' + menuItem.icon);
    this.renderer2.appendChild(link, icon);
    let span = this.renderer2.createElement('span');
    this.renderer2.addClass(span, 'menu-title');
    this.renderer2.appendChild(link, span);
    let menuText = this.renderer2.createText(
      this.translateService.instant(menuItem.title)
    );
    this.renderer2.appendChild(span, menuText);
    this.renderer2.appendChild(li, link);
    this.renderer2.setAttribute(link, 'id', 'link' + menuItem.id);
    this.renderer2.addClass(link, 'transition');
    if (menuItem.routerLink) {
      this.renderer2.listen(link, 'click', () => {
        this.router.navigate([menuItem.routerLink]);
        this.setActiveLink(menu, link);
      });
    }
    if (menuItem.href) {
      this.renderer2.setAttribute(link, 'href', menuItem.href);
    }
    if (menuItem.target) {
      this.renderer2.setAttribute(link, 'target', menuItem.target);
    }
    if (menuItem.hasSubMenu) {
      this.renderer2.addClass(li, 'menu-item-has-children');
      let subMenu = this.renderer2.createElement('ul');
      this.renderer2.addClass(subMenu, 'sub-menu');
      this.renderer2.appendChild(li, subMenu);
      this.createSubMenu(menu, menuItem.id, subMenu, 'horizontal');
    }
    return li;
  }

  private createSubMenu(
    menu: Array<Menu>,
    menuItemId: number,
    parentElement: any,
    type: string
  ) {
    let menus = menu.filter((item) => item.parentId === menuItemId);
    menus.forEach((menuItem) => {
      let subMenu = null;
      if (type == 'vertical') {
        subMenu = this.createVerticalMenuItem(menu, menuItem);
      }
      if (type == 'horizontal') {
        subMenu = this.createHorizontalMenuItem(menu, menuItem);
      }
      this.renderer2.appendChild(parentElement, subMenu);
    });
  }

  private closeOtherSubMenus(elem: any) {
    let children = this.renderer2.parentNode(elem).children;
    for (let i = 0; i < children.length; i++) {
      let child = this.renderer2.nextSibling(children[i].children[0]);
      if (child) {
        this.renderer2.addClass(children[i].children[0], 'collapsed');
        this.renderer2.removeClass(child, 'show');
      }
    }
  }

  public getActiveLink(menu: Array<Menu>) {
    let url = this.location.path();
    let routerLink = url ? url : '/'; // url.substring(1, url.length);
    let activeMenuItem = menu.filter((item) => item.routerLink === routerLink);
    if (activeMenuItem[0]) {
      let activeLink = document.querySelector('#link' + activeMenuItem[0].id);
      return activeLink;
    }
    return false;
  }

  public setActiveLink(menu: Array<Menu>, link: any) {
    if (link) {
      menu.forEach((menuItem) => {
        let activeLink = document.querySelector('#link' + menuItem.id);
        if (activeLink) {
          if (activeLink.classList.contains('active-link')) {
            activeLink.classList.remove('active-link');
          }
        }
      });
      this.renderer2.addClass(link, 'active-link');
    }
  }

  public showActiveSubMenu(menu: Array<Menu>) {
    let url = this.location.path();
    let routerLink = url; //url.substring(1, url.length);
    let activeMenuItem = menu.filter((item) => item.routerLink === routerLink);
    if (activeMenuItem[0]) {
      let activeLink = document.querySelector('#link' + activeMenuItem[0].id);
      let parent = this.renderer2.parentNode(activeLink);

      while (this.renderer2.parentNode(parent)) {
        parent = this.renderer2.parentNode(parent);
        if (parent.classList.contains('collapse')) {
          let parentMenu = menu.filter(
            (item) => item.id === activeMenuItem[0].parentId
          );
          let activeParentLink = document.querySelector(
            '#link' + parentMenu[0].id
          );
          this.renderer2.removeClass(activeParentLink, 'collapsed');
          this.renderer2.addClass(parent, 'show');
        }
        if (parent.classList.contains('menu-wrapper')) {
          break;
        }
      }
    }
  }

  public addNewMenuItem(menu: Array<Menu>, newMenuItem: any, type: string) {
    menu.push(newMenuItem);
    if (newMenuItem.parentId != 0) {
      let parentMenu = menu.filter((item) => item.id === newMenuItem.parentId);
      if (parentMenu.length) {
        if (!parentMenu[0].hasSubMenu) {
          parentMenu[0].hasSubMenu = true;
          // parentMenu[0].routerLink = null;
        }
      }
    }
    let menu_wrapper = null;
    if (type == 'vertical') {
      menu_wrapper = document.getElementById('vertical-menu');
    }
    if (type == 'horizontal') {
      menu_wrapper = document.getElementById('horizontal-menu');
    }
    if (!menu_wrapper) {
      return;
    }
    while (menu_wrapper.firstChild) {
      menu_wrapper.removeChild(menu_wrapper.firstChild);
    }
    this.createMenu(menu, menu_wrapper, type);
  }
}
