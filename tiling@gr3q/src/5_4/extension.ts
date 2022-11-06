import { App } from "./tiler";

let metadata: any;

let app: App;

export const init = (meta: any) => {
    metadata = meta;
}

export const enable = () => {
    app = new App();
}

export const disable = () => {
    app.Destroy();
}