export type journey = {
  start: tripLocation,
  end: tripLocation
}

export type tripLocation = {
  name: string,
  code: string
}

export type tripNode = {
  nextLink: 'CONTINUED' | 'UNCONTINUED' | 'LEVEL_UP_CONT' | 'LEVEL_DOWN_CONT' | 'LEVEL_UP_UNCONT' | 'LEVEL_DOWN_UNCONT' | ''
  level: number,
  start: string,
  end: string
}