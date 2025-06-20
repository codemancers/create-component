import * as ReactConverter from "./FigmaToReact.js";
import * as VueConverter from "./FigmaToVue.js";
import * as AngularConverter from "./FigmaToAngular.js";

const converters = [ReactConverter, VueConverter, AngularConverter];

// detect framework
export function detectFramework(dependencies, isTS) {
  for (const converter of converters) {
    if (converter.isProject && converter.isProject(dependencies)) {
      let extension;
      if (typeof converter.extension === "function") {
        extension = converter.extension(isTS);
      } else {
        extension = converter.extension;
      }
      return {
        framework: converter.framework,
        extension,
      };
    }
  }
  return { framework: null, extension: null };
}

//
const converterRegistry = new Map();

export function registerConverter(framework, converterClass) {
  converterRegistry.set(framework, converterClass);
}

export function getConverter(framework) {
  return converterRegistry.get(framework);
}

// register convertes
registerConverter(ReactConverter.framework, ReactConverter.default);
registerConverter(VueConverter.framework, VueConverter.default);
registerConverter(AngularConverter.framework, AngularConverter.default);
