import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Maps a DB key (theme_xxx) to the CSS custom property it drives.
const CSS_VAR_MAP: Record<string, string> = {
  theme_primary: '--primary',
  theme_primary_dark: '--primary-dark',
  theme_secondary: '--secondary',
  theme_sidebar_bg: '--sidebar-bg',
  theme_sidebar_text: '--sidebar-text',
  theme_sidebar_hover_bg: '--sidebar-hover-bg',
  theme_sidebar_active_bg: '--sidebar-active',
  theme_topbar_bg: '--topbar-bg',
  theme_body_bg: '--body-bg',
  theme_card_bg: '--card-bg',
  theme_border: '--border',
  theme_table_header_bg: '--table-header-bg',
  theme_table_row_hover_bg: '--table-row-hover-bg',
  theme_success: '--success-green',
  theme_warning: '--warning',
  theme_danger: '--danger',
  theme_login_overlay: '--login-overlay',
  theme_login_card_bg: '--login-card-bg',
};

// Fields editable from the Appearance settings page — grouped for the UI.
export interface ThemeFieldDef {
  key: string;
  label: string;
  group: string;
  type: 'color' | 'text' | 'select' | 'checkbox';
  options?: { value: string; label: string }[];
}

export const THEME_FIELDS: ThemeFieldDef[] = [
  { key: 'theme_primary', label: 'Primary Color', group: 'Brand', type: 'color' },
  { key: 'theme_primary_dark', label: 'Primary (Dark shade)', group: 'Brand', type: 'color' },
  { key: 'theme_secondary', label: 'Secondary / Accent Color', group: 'Brand', type: 'color' },
  { key: 'theme_success', label: 'Success Color', group: 'Brand', type: 'color' },
  { key: 'theme_warning', label: 'Warning Color', group: 'Brand', type: 'color' },
  { key: 'theme_danger', label: 'Danger Color', group: 'Brand', type: 'color' },

  { key: 'theme_sidebar_bg', label: 'Sidebar Background', group: 'Sidebar', type: 'color' },
  { key: 'theme_sidebar_text', label: 'Sidebar Text', group: 'Sidebar', type: 'color' },
  { key: 'theme_sidebar_active_bg', label: 'Sidebar Active Item', group: 'Sidebar', type: 'color' },
  { key: 'theme_sidebar_hover_bg', label: 'Sidebar Hover (rgba allowed)', group: 'Sidebar', type: 'text' },

  { key: 'theme_topbar_bg', label: 'Topbar Background', group: 'Topbar', type: 'color' },

  { key: 'theme_body_bg', label: 'Page Background', group: 'Layout', type: 'color' },
  { key: 'theme_card_bg', label: 'Card Background', group: 'Layout', type: 'color' },
  { key: 'theme_border', label: 'Border Color', group: 'Layout', type: 'color' },

  { key: 'theme_table_header_bg', label: 'Table Header Background', group: 'Tables', type: 'color' },
  { key: 'theme_table_row_hover_bg', label: 'Table Row Hover', group: 'Tables', type: 'color' },

  { key: 'theme_app_name', label: 'App Name', group: 'Branding', type: 'text' },

  // Layout — previously the floating demo "Settings" gear panel
  {
    key: 'theme_menu_layout', label: 'Menu Layout', group: 'Menu Layout', type: 'select',
    options: [{ value: 'vertical', label: 'Vertical' }, { value: 'horizontal', label: 'Horizontal' }],
  },
  {
    key: 'theme_menu_type', label: 'Menu Type', group: 'Menu Layout', type: 'select',
    options: [{ value: 'default', label: 'Default' }, { value: 'compact', label: 'Compact' }, { value: 'mini', label: 'Mini' }],
  },
  { key: 'theme_fixed_header', label: 'Fixed Header', group: 'Menu Layout', type: 'checkbox' },
  { key: 'theme_fixed_sidebar', label: 'Fixed Sidebar', group: 'Menu Layout', type: 'checkbox' },
  { key: 'theme_fixed_footer', label: 'Fixed Footer', group: 'Menu Layout', type: 'checkbox' },

  // Login page
  { key: 'theme_login_bg_image', label: 'Background Image URL', group: 'Login Page', type: 'text' },
  { key: 'theme_login_overlay', label: 'Background Overlay (rgba)', group: 'Login Page', type: 'text' },
  { key: 'theme_login_card_bg', label: 'Login Card Background (rgba)', group: 'Login Page', type: 'text' },
];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private base = `${environment.apiUrl}`;

  // Read by the sidebar/topbar/login page for the logo image + app name.
  logoUrl = signal<string>('assets/img/logo.png');
  appName = signal<string>('United Ram Construction');
  loaded = signal<boolean>(false);
  // Raw last-loaded theme dict — AppComponent reads this once to push the
  // menu-layout keys into the template's own AppSettings service.
  raw = signal<Record<string, string> | null>(null);

  constructor(private http: HttpClient) {}

  /** Fetch theme settings and apply them as CSS custom properties on <html>. Call once at app bootstrap. */
  async loadAndApply(): Promise<void> {
    try {
      const res: any = await this.http.get(`${this.base}/theme`).toPromise();
      const data = res?.data || {};
      this.apply(data);
    } catch (e) {
      // Network hiccup or fresh install with no table yet — app still works with SCSS defaults.
    } finally {
      this.loaded.set(true);
    }
  }

  apply(data: Record<string, string>): void {
    const root = document.documentElement;
    for (const [dbKey, cssVar] of Object.entries(CSS_VAR_MAP)) {
      const val = data[dbKey];
      if (val) root.style.setProperty(cssVar, val);
    }
    if (data['theme_login_bg_image']) {
      root.style.setProperty('--login-bg-image', `url('${data['theme_login_bg_image']}')`);
    }
    if (data['theme_logo_url']) this.logoUrl.set(data['theme_logo_url']);
    if (data['theme_app_name']) this.appName.set(data['theme_app_name']);
    this.raw.set(data);
  }

  getTheme() {
    return this.http.get<any>(`${this.base}/theme`);
  }

  updateTheme(data: Record<string, string>) {
    return this.http.put<any>(`${this.base}/theme`, data);
  }

  resetTheme() {
    return this.http.post<any>(`${this.base}/theme/reset`, {});
  }
}
