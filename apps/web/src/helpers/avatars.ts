import { apiUrl } from './constants'

export function getImageUrl(avatarUrl: string | undefined, fallBackImg?: string): string {
  if (fallBackImg) {
    return avatarUrl ? apiUrl + '/' + avatarUrl.replace('\\', '/') : fallBackImg
  } else return apiUrl + '/' + avatarUrl?.replace('\\', '/')
}
