import { environment } from '../../../environments/environment';

// The backend's own origin (scheme + host[:port]), trailing "/api" stripped.
// Exported (not just local) so every other place that needs to build a
// "/uploads/..." URL can reuse this SAME end-anchored regex instead of each
// reinventing its own `environment.apiUrl.replace('/api', '')` — that naive
// form replaces the FIRST match anywhere in the string, which silently
// corrupts it in production because the API host is itself named
// "api.unitedram.com": the "/api" formed by "://api" is found before the
// real trailing "/api" path and gets stripped instead, e.g.
// "https://api.unitedram.com/api" -> "https:/.unitedram.com/api" (broken).
export const SERVER_ORIGIN = environment.apiUrl.replace(/\/api\/?$/, '');

/**
 * Avatars are stored as a relative path (e.g. "/uploads/avatars/x.jpg") once
 * uploaded via the backend, but may also be a full external URL for legacy
 * data. Normalize both cases into an absolute URL for <img [src]>.
 */
export function resolveAvatarUrl(avatar?: string | null): string {
  if (!avatar) return 'assets/img/users/user.jpg';
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `${SERVER_ORIGIN}${avatar}`;
}
