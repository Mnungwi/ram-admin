import { environment } from '../../../environments/environment';

const SERVER_ORIGIN = environment.apiUrl.replace(/\/api\/?$/, '');

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
