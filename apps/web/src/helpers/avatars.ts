import defaultAvatar from '../assets/avatar/default-avatar.webp'
import { apiUrl } from './constants'

export function getImageUrl(avatarUrl: string | undefined, fallBackAvatar: boolean = true): string {
  if (fallBackAvatar) {
    return avatarUrl ? apiUrl + '/' + avatarUrl.replace('\\', '/') : defaultAvatar
  } else return apiUrl + '/' + avatarUrl?.replace('\\', '/')
}
