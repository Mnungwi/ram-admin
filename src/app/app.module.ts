import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NgScrollbarModule } from 'ngx-scrollbar';

import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxBootstrapMultiselectModule } from 'ngx-bootstrap-multiselect';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

import { ToastrModule } from 'ngx-toastr';
import { PipesModule } from './theme/pipes/pipes.module';

import { AppRoutingModule } from './app.routing';
import { AppSettings } from './app.settings';

// StartNG shell components (NgModule-based, kept as-is)
import { AppComponent } from './app.component';
import { PagesComponent } from './pages/pages.component';
import { HeaderComponent } from './theme/components/header/header.component';
import { FooterComponent } from './theme/components/footer/footer.component';
import { SidebarComponent } from './theme/components/sidebar/sidebar.component';
import { VerticalMenuComponent } from './theme/components/menu/vertical-menu/vertical-menu.component';
import { HorizontalMenuComponent } from './theme/components/menu/horizontal-menu/horizontal-menu.component';
import { BreadcrumbComponent } from './theme/components/breadcrumb/breadcrumb.component';
import { BackTopComponent } from './theme/components/back-top/back-top.component';
import { FullScreenComponent } from './theme/components/fullscreen/fullscreen.component';
import { ApplicationsComponent } from './theme/components/applications/applications.component';
import { MessagesComponent } from './theme/components/messages/messages.component';
import { UserMenuComponent } from './theme/components/user-menu/user-menu.component';
import { FlagsMenuComponent } from './theme/components/flags-menu/flags-menu.component';
import { SideChatComponent } from './theme/components/side-chat/side-chat.component';
import { FavoritesComponent } from './theme/components/favorites/favorites.component';
import { BlankComponent } from './pages/blank/blank.component';
import { SearchComponent } from './pages/search/search.component';
import { NotFoundComponent } from './pages/errors/not-found/not-found.component';

// ── Farida Projects: JWT interceptor ─────────────────────────────────────────
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
// ─────────────────────────────────────────────────────────────────────────────

// NOTE: Farida standalone components (Dashboard, Projects, Letters, Store,
// Users, Suppliers, Settings, Login) are NOT declared here.
// Standalone components register themselves — they are lazy-loaded via
// loadComponent() in app.routing.ts and need no NgModule declaration.

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    NgScrollbarModule,
    NgbModule,
    NgxBootstrapMultiselectModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    ToastrModule.forRoot(),
    PipesModule,
    AppRoutingModule,
    // HttpClientModule removed — replaced by provideHttpClient() in providers
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  declarations: [
    // StartNG shell components stay here (they are NOT standalone)
    AppComponent,
    PagesComponent,
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    VerticalMenuComponent,
    HorizontalMenuComponent,
    BreadcrumbComponent,
    BackTopComponent,
    FullScreenComponent,
    ApplicationsComponent,
    MessagesComponent,
    UserMenuComponent,
    FlagsMenuComponent,
    SideChatComponent,
    FavoritesComponent,
    BlankComponent,
    SearchComponent,
    NotFoundComponent,
    // ── Farida components are NOT listed here ─────────────────────────────
    // They are standalone — listing them here would cause a compile error
    // ─────────────────────────────────────────────────────────────────────
  ],
  providers: [
    AppSettings,

    // ── Replaces HttpClientModule + registers JWT interceptor ─────────────
    provideHttpClient(withInterceptors([jwtInterceptor])),
    // ─────────────────────────────────────────────────────────────────────
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

// import { BrowserModule } from '@angular/platform-browser';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { NgModule } from '@angular/core';
// import { FormsModule } from '@angular/forms';

// import { NgScrollbarModule } from 'ngx-scrollbar';

// import { HttpClient, HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
// import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
// import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// export function HttpLoaderFactory(httpClient: HttpClient) {
//   return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
// }

// import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
// import { NgxBootstrapMultiselectModule } from 'ngx-bootstrap-multiselect';
// import { CalendarModule, DateAdapter } from 'angular-calendar';
// import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

// import { ToastrModule } from 'ngx-toastr';
// import { PipesModule } from './theme/pipes/pipes.module';

// import { AppRoutingModule } from './app.routing';
// import { AppSettings } from './app.settings';

// import { AppComponent } from './app.component';
// import { PagesComponent } from './pages/pages.component';
// import { HeaderComponent } from './theme/components/header/header.component';
// import { FooterComponent } from './theme/components/footer/footer.component';
// import { SidebarComponent } from './theme/components/sidebar/sidebar.component';
// import { VerticalMenuComponent } from './theme/components/menu/vertical-menu/vertical-menu.component';
// import { HorizontalMenuComponent } from './theme/components/menu/horizontal-menu/horizontal-menu.component';
// import { BreadcrumbComponent } from './theme/components/breadcrumb/breadcrumb.component';
// import { BackTopComponent } from './theme/components/back-top/back-top.component';
// import { FullScreenComponent } from './theme/components/fullscreen/fullscreen.component';
// import { ApplicationsComponent } from './theme/components/applications/applications.component';
// import { MessagesComponent } from './theme/components/messages/messages.component';
// import { UserMenuComponent } from './theme/components/user-menu/user-menu.component';
// import { FlagsMenuComponent } from './theme/components/flags-menu/flags-menu.component';
// import { SideChatComponent } from './theme/components/side-chat/side-chat.component';
// import { FavoritesComponent } from './theme/components/favorites/favorites.component';
// import { BlankComponent } from './pages/blank/blank.component';
// import { SearchComponent } from './pages/search/search.component';
// import { NotFoundComponent } from './pages/errors/not-found/not-found.component';
// import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

// @NgModule({
//   imports: [
//     BrowserModule,
//     BrowserAnimationsModule,
//     FormsModule,
//     NgScrollbarModule,
//     NgbModule,
//     NgxBootstrapMultiselectModule,
//     CalendarModule.forRoot({
//       provide: DateAdapter,
//       useFactory: adapterFactory,
//     }),
//     ToastrModule.forRoot(),
//     PipesModule,
//     AppRoutingModule,
//     HttpClientModule,
//     TranslateModule.forRoot({
//       loader: {
//         provide: TranslateLoader,
//         useFactory: HttpLoaderFactory,
//         deps: [HttpClient],
//       },
//     }),
//   ],
//   declarations: [
//     AppComponent,
//     PagesComponent,
//     HeaderComponent,
//     FooterComponent,
//     SidebarComponent,
//     VerticalMenuComponent,
//     HorizontalMenuComponent,
//     BreadcrumbComponent,
//     BackTopComponent,
//     FullScreenComponent,
//     ApplicationsComponent,
//     MessagesComponent,
//     UserMenuComponent,
//     FlagsMenuComponent,
//     SideChatComponent,
//     FavoritesComponent,
//     BlankComponent,
//     SearchComponent,
//     NotFoundComponent,
//   ],
//   providers: [
//     AppSettings,
//     provideHttpClient(withInterceptors([jwtInterceptor])),
//   ],
//   bootstrap: [AppComponent],
// })
// export class AppModule {}
