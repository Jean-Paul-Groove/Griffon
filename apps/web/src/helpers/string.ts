export const capitalizeString = (string: string): string => {
  console.log(string[0].toUpperCase())
  return string[0].toUpperCase() + string.slice(1).toLowerCase()
}
