# Local setup

1. clone the repo
2. Create Figma access token
3. In the test repos package.json in devDependencies add "create-component": "file:/local_repo_path"
4. run `npm i` in the test repo
5. for first time when the package is executed, it asks for figma_access token, please enter token, it will be stored locally for future use.

## command to create a component in a project repo

npx create-component --figma-link="link" --name=CardComponent

### agrs

1. --figma-link: pass figma_link of the component
2. --name: name of the component (optional, default will be the name of the node in figma design)

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

#### Label for Input fiels

- **structure:**

  - container (name label)
    - text field (type TEXT)

- **Naming:** label-label_name (eg., label-driver_name)

# Adding a new framework

To add support for a new framework (e.g., Svelte), follow these steps:

1. **Update the detectProjectConfig method in create-component file for new framework**

   - Update the logic in `lib/create-component.js` to detect the framework

2. **Create a new converter file**

   - Example: `lib/converters/FigmaToSvelte.js`
   - Implement your converter class (extend the base converter if needed).

3. **Register your converter**

   - At the top of your new file, import the registry:
     ```js
     import { registerConverter } from "./ConverterRegistry.js";
     ```
   - After defining your class, register it:

     ```js
     export default class FigmaToSvelte {
       /* ... */
     }
     registerConverter("svelte", FigmaToSvelte);
     ```

4. **Update the converter index**

   - Add an import for your new converter in `lib/converters/index.js`:
     ```js
     import "./FigmaToSvelte.js";
     ```
   - This ensures your converter is registered when the tool runs.

**Example directory structure after adding Svelte:**

```
lib/
  converters/
    FigmaToReact.js
    FigmaToVue.js
    FigmaToAngular.js
    FigmaToSvelte.js   <-- your new file
    ConverterRegistry.js
    index.js           <-- imports all converter files
```
