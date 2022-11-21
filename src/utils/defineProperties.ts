export function defineProperties<T extends Record<string, any>>(
  obj: T,
  props: { [K in keyof T]?: T[K] }
): T {
  const map: PropertyDescriptorMap = {};
  for (const key in props) {
    map[key] = {
      value: props[key],
      writable: false,
      enumerable: true,
      configurable: false
    };
  }
  return Object.defineProperties(obj, map);
}
