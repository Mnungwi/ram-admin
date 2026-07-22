import { Component, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  permission?: string;
  badge?: number;
  children?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <!-- Sidebar -->
    <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">F</div>
        <span class="logo-text">Farida Projects</span>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        @for (section of navSections; track section.title) {
          <div class="nav-section-title">{{ section.title }}</div>
          @for (item of section.items; track item.label) {
            @if (canSee(item)) {
              <a class="nav-item"
                 [routerLink]="item.route"
                 routerLinkActive="active"
                 [routerLinkActiveOptions]="{exact: item.route === '/dashboard'}">
                <i class="bi bi-{{ item.icon }} nav-icon"></i>
                <span class="nav-label">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="nav-badge">{{ item.badge }}</span>
                }
              </a>
            }
          }
        }
      </nav>

      <!-- Sidebar footer -->
      <div class="sidebar-footer">
        <a class="nav-item" routerLink="/settings">
          <i class="bi bi-gear nav-icon"></i>
          <span class="nav-label">Settings</span>
        </a>
        <div class="nav-item" (click)="logout()">
          <i class="bi bi-box-arrow-left nav-icon" style="color: #ef4444"></i>
          <span class="nav-label" style="color: #ef4444">Logout</span>
        </div>
      </div>
    </aside>

    <!-- Topbar -->
    <header class="topbar" [class.sidebar-collapsed]="sidebarCollapsed()">
      <button class="topbar-toggle" (click)="toggleSidebar()" title="Toggle sidebar">
        <i class="bi bi-list"></i>
      </button>

      <div class="topbar-breadcrumb">
        <span>{{ breadcrumb() }}</span>
      </div>

      <div class="topbar-actions">
        <!-- Notifications -->
        <button class="topbar-btn" title="Notifications">
          <i class="bi bi-bell"></i>
          <span class="notif-dot"></span>
        </button>

        <!-- Search -->
        <button class="topbar-btn" title="Search">
          <i class="bi bi-search"></i>
        </button>

        <!-- User avatar dropdown -->
        <div class="dropdown">
          <div class="user-avatar" data-toggle="dropdown" style="cursor:pointer" title="Profile">
            {{ auth.userInitials() }}
          </div>
          <div class="dropdown-menu dropdown-menu-right" style="min-width:200px; border-radius:8px; padding:8px 0; border-color:#e5e7eb">
            <div style="padding:10px 16px; border-bottom:1px solid #f3f4f6; margin-bottom:4px">
              <div style="font-weight:600; font-size:14px; color:#111827">{{ auth.userFullName() }}</div>
              <div style="font-size:12px; color:#6b7280">{{ auth.currentUser()?.jobTitle }}</div>
            </div>
            <a class="dropdown-item" routerLink="/settings" style="font-size:13px; padding:8px 16px">
              <i class="bi bi-person me-2"></i> My Profile
            </a>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" (click)="logout()" style="font-size:13px; padding:8px 16px; color:#ef4444">
              <i class="bi bi-box-arrow-left me-2"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content" [class.sidebar-collapsed]="sidebarCollapsed()">
      <div class="page-content">
        <router-outlet />
      </div>
    </main>
  `
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);

  navSections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard',   icon: 'speedometer2',    route: '/dashboard' },
        { label: 'Projects',    icon: 'building',        route: '/projects',   permission: 'project:view' },
      ]
    },
    {
      title: 'Project Work',
      items: [
        { label: 'Letters',     icon: 'envelope',        route: '/letters',    permission: 'letter:view' },
        { label: 'Store',       icon: 'box-seam',        route: '/store',      permission: 'store:view' },
        { label: 'Suppliers',   icon: 'truck',           route: '/suppliers',  permission: 'supplier:view' },
      ]
    },
    {
      title: 'Administration',
      items: [
        { label: 'Users',       icon: 'people',          route: '/users',      permission: 'user:view' },
      ]
    }
  ];

  breadcrumb = computed(() => 'Farida Projects');

  constructor(public auth: AuthService, private router: Router) {}

  canSee(item: NavItem): boolean {
    if (!item.permission) return true;
    return this.auth.hasPermission(item.permission);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  logout(): void {
    this.auth.logout();
  }
}
