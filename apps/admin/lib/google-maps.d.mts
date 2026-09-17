export type Coordinates = {latitude:number; longitude:number};
export function mapsLink(value:string):string|null;
export function coordinatesFromMaps(value:string):Coordinates|null;
export function resolveMaps(value:string,fetcher?:typeof fetch):Promise<Coordinates|null>;
