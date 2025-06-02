# Local setup

1. Create Figma access token and paste it in .env
2. In the test repos package.json in devDependencies add "create-component": "file:/file_path"
3. run `npm i` in the test repo

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
