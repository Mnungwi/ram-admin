import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { MenuService } from '../menu.service';
import { AppSettings } from '../../../../app.settings';
import { Settings } from '../../../../app.settings.model';
import { Menu } from '../menu.model';
import { NgScrollbar } from 'ngx-scrollbar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vertical-menu',
  templateUrl: './vertical-menu.component.html',
  styleUrls: ['./vertical-menu.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [MenuService],
  standalone: true,
  imports: [NgScrollbar, RouterModule, CommonModule],
})
export class VerticalMenuComponent implements OnInit, AfterViewInit {
  @Input('menuItems') menuItems: Menu[] = []; // Default empty array
  public settings: Settings;

  constructor(
    public appSettings: AppSettings,
    private menuService: MenuService,
    private router: Router
  ) {
    this.settings = this.appSettings.settings;

    // Listen to route changes to update active link
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        window.scrollTo(0, 0);
        let activeLink = this.menuService.getActiveLink(this.menuItems);
        this.menuService.setActiveLink(this.menuItems, activeLink);

        // Initialize tooltips
        this.initializeTooltips();

        // Close menu on mobile
        if (window.innerWidth <= 768) {
          this.settings.theme.showMenu = false;
        }
      }
    });
  }

  ngOnInit() {
    this.updateMenu();

    // Handle mini menu tooltips
    if (this.settings.theme.menuType == 'mini') {
      this.initializeTooltips();
    }
  }

  ngAfterViewInit() {
    // Show active submenu and set active link after view init
    this.menuService.showActiveSubMenu(this.menuItems);
    let activeLink = this.menuService.getActiveLink(this.menuItems);
    this.menuService.setActiveLink(this.menuItems, activeLink);
  }

  private updateMenu() {
    // Update menu only if menuItems is available
    if (this.menuItems && this.menuItems.length > 0) {
      const menuWrapper = document.getElementById('vertical-menu');
      if (menuWrapper) {
        this.menuService.createMenu(this.menuItems, menuWrapper, 'vertical');
      }
    }
  }

  private initializeTooltips() {
    // Tooltip initialization with Angular-friendly approach
    const elements = document.querySelectorAll('.menu-item-link');
    elements.forEach((el: any) => {
      const title = el.getAttribute('title');
      if (title) {
        el.setAttribute('data-bs-toggle', 'tooltip');
        el.setAttribute('data-bs-placement', 'right');
      }
    });

    // Bootstrap Tooltip initialization (ensure Bootstrap is added in your project)
    // Or use ngx-bootstrap or other Angular tooltip libraries
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach((tooltipTriggerEl: any) => {
      //new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
}
