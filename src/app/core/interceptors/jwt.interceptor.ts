import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  BehaviorSubject,
  throwError,
  switchMap,
  filter,
  take,
  catchError,
} from 'rxjs';

import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AuthService);

  const token = auth.getAccessToken();

  const authRequest = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthRequest =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/logout');

      if (error.status !== 401 || isAuthRequest) {
        return throwError(() => error);
      }

      // Refresh already running
      if (isRefreshing) {
        return refreshSubject.pipe(
          filter((token): token is string => token !== null),
          take(1),
          switchMap((newToken) => {
            const retry = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });

            return next(retry);
          }),
        );
      }

      isRefreshing = true;
      refreshSubject.next(null);

      return auth.refreshToken().pipe(
        switchMap((res: any) => {
          isRefreshing = false;

          const newToken = res.data.accessToken;

          refreshSubject.next(newToken);

          const retry = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          });

          return next(retry);
        }),

        catchError((err) => {
          isRefreshing = false;

          refreshSubject.next(null);

          auth.forceLogout();

          return throwError(() => err);
        }),
      );
    }),
  );
};
// import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { catchError, switchMap, throwError } from 'rxjs';
// import { AuthService } from '../services/auth.service';

// export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
//   const auth = inject(AuthService);
//   const token = auth.getAccessToken();

//   const authReq = token ? req.clone({
//     setHeaders: { Authorization: `Bearer ${token}` }
//   }) : req;

//   return next(authReq).pipe(
//     catchError((err: HttpErrorResponse) => {
//       if (err.status === 401 && !req.url.includes('/auth/')) {
//         return auth.refreshToken().pipe(
//           switchMap(res => {
//             const retryReq = req.clone({
//               setHeaders: { Authorization: `Bearer ${res.data.accessToken}` }
//             });
//             return next(retryReq);
//           }),
//           catchError(refreshErr => throwError(() => refreshErr))
//         );
//       }
//       return throwError(() => err);
//     })
//   );
// };
