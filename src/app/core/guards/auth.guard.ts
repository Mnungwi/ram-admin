import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return !auth.isLoggedIn() ? true : router.createUrlTree(['/']);
};

export const permissionGuard =
  (permission: string): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.hasPermission(permission) ? true : router.createUrlTree(['/']);
  };

// import { inject } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// import { AuthService } from '../services/auth.service';

// // Protects all pages — redirects to StartNG's /login path
// export const authGuard: CanActivateFn = () => {
//   const auth   = inject(AuthService);
//   const router = inject(Router);
//   if (auth.isLoggedIn()) return true;
//   router.navigate(['/login']);
//   return false;
// };

// // Prevents logged-in users from seeing the login page
// export const guestGuard: CanActivateFn = () => {
//   const auth   = inject(AuthService);
//   const router = inject(Router);
//   if (!auth.isLoggedIn()) return true;
//   router.navigate(['/']);
//   return false;
// };

// export const permissionGuard = (permission: string): CanActivateFn => () => {
//   const auth   = inject(AuthService);
//   const router = inject(Router);
//   if (auth.hasPermission(permission)) return true;
//   router.navigate(['/']);
//   return false;
// };
