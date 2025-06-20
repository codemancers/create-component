const converterRegistry = new Map();

export function registerConverter(framework, converterClass) {
  converterRegistry.set(framework, converterClass);
}

export function getConverter(framework) {
  return converterRegistry.get(framework);
}
