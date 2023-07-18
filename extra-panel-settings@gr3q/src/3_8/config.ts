import { Extension } from "./extension";

const { ExtensionSettings } = imports.ui.settings;

const CONFIG_KEYS = {
    CUSTOM_FONT: "panelFont",
    PANEL_COLOR: "panelColor",
    PANEL_BORDER_RADIUS: "panelBorderRadius",
    PANEL_PADDING: "panelPadding",
    PANEL_MARGIN: "panelMargin",
}

const customKeys: (keyof typeof CONFIG_KEYS)[] = [
    "CUSTOM_FONT"
];

export class Config {
    private readonly _panelFont!: string;

    private panelFont: string | null = null;
    public get PanelFont(): string | null {
        return this.panelFont;
    }

    private panelFontSize: number | null = null;
    public get PanelFontSize(): number | null {
        return this.panelFontSize;
    }

    private _panelColor!: string;
    public get PanelColor(): string {
        return this._panelColor;

    }

    private _panelBackgroundColor!: string;
    public get PanelBackgroundColor(): string {
        return this._panelBackgroundColor;
    }

    private _panelBorderRadius!: number;
    public get PanelBorderRadius(): number {
        return this._panelBorderRadius;
    }

    private _panelPadding!: number;
    public get PanelPadding(): number {
        return this._panelPadding;
    }

    private _panelMargin!: number;
    public get PanelMargin(): number {
        return this._panelMargin;
    }

    settings = new ExtensionSettings(this, 'extra-panel-settings@gr3q');
    private readonly app: Extension; 

    constructor(app: Extension) {
        this.app = app;
    }

    Enable() {
        this.settings.bind(CONFIG_KEYS.CUSTOM_FONT, "_" + CONFIG_KEYS.CUSTOM_FONT, () => {
            this.ProcessSelectedFont();
            this.app.ApplyStyles();
        });

        let key: keyof typeof CONFIG_KEYS;
        for (key in CONFIG_KEYS) {
            if (customKeys.includes(key))
                continue;

            this.settings.bind(CONFIG_KEYS[key], "_" + CONFIG_KEYS[key], () => {
                this.app.ApplyStyles();
            });
        }

        this.ProcessSelectedFont();
    }

    Disable() {
        let key: keyof typeof CONFIG_KEYS;
        for (key in CONFIG_KEYS) {
            this.settings.unbindAll(CONFIG_KEYS[key]);
        }
    }

    private ProcessSelectedFont() {
        if (this._panelFont == "") {
            this.panelFont = null;
            this.panelFontSize = null;
            return;
        }

        const words = this._panelFont.split(" ");

        this.panelFontSize = parseFloat(words[words.length - 1]);

        // Parse special stuff in Font
        const fontName: string[] = [];
        for (const word of words.slice(0, words.length - 1)) {
            if (word.includes("=")) {
                continue;
            }
            fontName.push(word);
        }
        this.panelFont = fontName.join(" ");
    }
}