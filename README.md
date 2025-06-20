# Local setup

1. clone the repo
2. Create Figma access token
3. In the test repo's package.json in devDependencies add "create-component": "file:/local_repo_path"
4. run `npm i` in the test repo
5. For the first time when the package is executed, it asks for figma_access token; please enter the token, it will be stored locally for future use.

## Command to create a component in a project repo

npx create-component --figma-link="link" --name=CardComponent

### Args

1. --figma-link: pass figma_link of the component (required)
2. --name: name of the component (optional, default will be the name of the node in Figma design)

> **Note:** The framework (React, Vue, Angular, etc.) and file extension (js/ts) are auto-detected based on your project's dependencies and config files. No need to specify them manually.

## Figma to Code (Figma design rules)

### Layout Guidelines

- Use flex layout throughout to achieve an exact matching UI.

### Naming Conventions

#### Tables

- **Table Naming:** table-table_name (e.g., table-sku_list)
- **Table Headings:** heading-content (e.g., heading-product_name)
- **Table Data:** data-content (e.g., data-price)

#### Images

- **Logos/Images/SVGs**: image-image_name (e.g., image-empty_state)

#### Input Fields

There are two types of input fields:

- Direct Input Field
  - **Naming:** input-input_name (e.g., input-armada_number)
- Input Field with Extra Elements (e.g., input with a search icon inside it). The structure is as follows:
  - **Input Box:** inputbox-inputbox_name (e.g., inputbox-search)
  - **Icon inside Input:** image-image_name (e.g., image-search_icon)
  - **Actual Input Field:** input-input_name (e.g., input-search_query)

#### Label for Input fields

- **structure:**

  - container (name label)
    - text field (type TEXT)

- **Naming:** label-label_name (eg., label-driver_name)

# Adding a new framework

To add support for a new framework (e.g., Svelte), follow these steps:

1. **Update the detectFramework logic in the converter registry**

   - In `lib/converters/converterRegistry.js`, add your new converter to the `converters` array and ensure it has an `isProject` method for detection.

2. **Create a new converter file**

   - Example: `lib/converters/FigmaToSvelte.js`
   - Implement your converter class (extend the base converter if needed).
   - Export the converter as default and ensure it has a `framework` property and an `isProject` method.

   ```js
   export default class FigmaToSvelte {
     /**  */
   }

   export function isProject(dependencies) {
     /**  */
   }

   export const framework = "svelte";
   export const extension = "svelte";
   ```

3. **Register your converter**

   - In `lib/converters/converterRegistry.js`, import your new converter

     ```js
     import * as SvelteConverter from "./FigmaToSvelte.js";
     // ...
     converter = [, /** existing converters */ SvelteConverter];
     registerConverter(SvelteConverter.framework, SvelteConverter.default);
     ```

**Example directory structure after adding Svelte:**

```
lib/
  converters/
    FigmaToReact.js
    FigmaToVue.js
    FigmaToAngular.js
    FigmaToSvelte.js   <-- your new file
    converterRegistry.js
```
