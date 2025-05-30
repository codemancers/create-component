# Local setup

1. Create Figma access token and paste it in .env
2. In the test repos package.json in devDependencies add "create-component": "file:/file_path"
3. run `npm i` in the test repo

## command to create a component in a project repo

npx create-component --react --ts --figma-link="link" --name=CardComponent

### agrs

1. --react: for react component (required)
2. --ts: for .tsx extension (optional, default is jsx)
3. --figma-link: pass figma_link of the component
4. --name: name of the component (optional, default will be the name of the node in figma design)

## constraints

1. All the styles should be flex box in the figma design
