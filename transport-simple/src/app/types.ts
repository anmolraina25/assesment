export type journey = {
  start: tripLocation,
  end: tripLocation
}

export type tripLocation = {
  name: string,
  code: string
}

export type tripNode = {
  nextLink: 'CONTINUED' | 'UNCONTINUED' | 'LEVEL_UP' | 'LEVEL DOWN' | ''
  level: number,
  start: string,
  end: string
}