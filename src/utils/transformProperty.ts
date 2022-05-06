import { Property, PropertyOptions, PropertyValue } from '../types';

function toProperty(
  key: string,
  property: PropertyValue<any>
): PropertyOptions<any> {
  // use key as default name if not provided
  return typeof property === 'object'
    ? { ...property, name: property.name ?? key }
    : { name: typeof property === 'string' ? property : key };
}

/**
 * Transform property options.
 * @param props The property options.
 * @returns The transformed property options.
 */
export function transformProperty<D extends Record<string, any>>(
  props: PropertyOptions<D>
): Property<D> {
  type Data = D[keyof D];
  const properties = { name: props.name ?? 'root' } as Property<D>;
  const entries = Object.entries(props) as [string, PropertyValue<Data>][];
  for (const [key, value] of entries) {
    if (key === 'name') {
      continue;
    }
    const next = toProperty(key, value);
    Object.assign(properties, { [key]: transformProperty(next) });
  }
  return properties;
}
