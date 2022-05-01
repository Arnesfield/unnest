export function createProperties(
  obj: Record<string, any>
): PropertyDescriptorMap {
  const map: PropertyDescriptorMap = {};
  for (const key in obj) {
    map[key] = {
      value: obj[key],
      writable: false,
      enumerable: true,
      configurable: false
    };
  }
  return map;
}
