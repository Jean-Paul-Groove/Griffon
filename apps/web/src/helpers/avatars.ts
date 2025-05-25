import { apiUrl } from './constants'
const slashRegex = /\\/g
export function getImageUrl(avatarUrl: string | undefined, fallBackImg?: string): string {
  if (fallBackImg) {
    return avatarUrl ? apiUrl + '/' + avatarUrl.replace(slashRegex, '/') : fallBackImg
  } else return apiUrl + '/' + avatarUrl?.replace(slashRegex, '/')
}
