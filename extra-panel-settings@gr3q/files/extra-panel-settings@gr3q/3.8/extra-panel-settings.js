var extraPanelSettings;
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Extension: () => (/* binding */ Extension),
  disable: () => (/* binding */ disable),
  enable: () => (/* binding */ enable),
  init: () => (/* binding */ init)
});

;// CONCATENATED MODULE: ./src/3_8/config.ts
const { ExtensionSettings } = imports.ui.settings;
const CONFIG_KEYS = {
    CUSTOM_FONT: "panelFont",
    PANEL_COLOR: "panelColor",
    PANEL_BORDER_RADIUS: "panelBorderRadius",
    PANEL_PADDING: "panelPadding",
    PANEL_MARGIN: "panelMargin",
};
const customKeys = [
    "CUSTOM_FONT"
];
class Config {
    constructor(app) {
        this.panelFont = null;
        this.panelFontSize = null;
        this.settings = new ExtensionSettings(this, 'extra-panel-settings@gr3q');
        this.app = app;
    }
    get PanelFont() {
        return this.panelFont;
    }
    get PanelFontSize() {
        return this.panelFontSize;
    }
    get PanelColor() {
        return this._panelColor;
    }
    get PanelBackgroundColor() {
        return this._panelBackgroundColor;
    }
    get PanelBorderRadius() {
        return this._panelBorderRadius;
    }
    get PanelPadding() {
        return this._panelPadding;
    }
    get PanelMargin() {
        return this._panelMargin;
    }
    Enable() {
        this.settings.bind(CONFIG_KEYS.CUSTOM_FONT, "_" + CONFIG_KEYS.CUSTOM_FONT, () => {
            this.ProcessSelectedFont();
            this.app.ApplyStyles();
        });
        let key;
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
        let key;
        for (key in CONFIG_KEYS) {
            this.settings.unbindAll(CONFIG_KEYS[key]);
        }
    }
    ProcessSelectedFont() {
        if (this._panelFont == "") {
            this.panelFont = null;
            this.panelFontSize = null;
            return;
        }
        const words = this._panelFont.split(" ");
        this.panelFontSize = parseFloat(words[words.length - 1]);
        const fontName = [];
        for (const word of words.slice(0, words.length - 1)) {
            if (word.includes("=")) {
                continue;
            }
            fontName.push(word);
        }
        this.panelFont = fontName.join(" ");
    }
}

;// CONCATENATED MODULE: ./src/3_8/extension.ts

const { panelManager } = imports.ui.main;
class Extension {
    constructor() {
        this.originalPanelStyles = [];
        this.enabled = false;
        this.panelsChangedKey = null;
        this.ApplyStyles = () => {
            var _a;
            if (this.settings.PanelFont == null) {
                this.RestoreOriginalStyle();
            }
            else {
                for (const panel of panelManager.getPanels()) {
                    if (panel == null)
                        continue;
                    if (this.originalPanelStyles[panel.panelId] == null) {
                        this.originalPanelStyles[panel.panelId] = panel.actor.style;
                    }
                    const panelEditMode = global.settings.get_boolean("panel-edit-mode");
                    panel.actor.style = ((_a = this.originalPanelStyles[panel.panelId]) !== null && _a !== void 0 ? _a : "");
                    panel.actor.style += `font-family: ${this.settings.PanelFont};`;
                    panel.actor.style += `font-size: ${this.settings.PanelFontSize}px;`;
                    panel.actor.style += `background-color: ${this.settings.PanelColor};`;
                    panel.actor.style += `border-radius: ${this.settings.PanelBorderRadius}px;`;
                    if (panel.panelPosition == imports.ui.panel.PanelLoc.top || panel.panelPosition == imports.ui.panel.PanelLoc.bottom)
                        panel.actor.style += `margin-left: ${this.settings.PanelMargin}px; margin-right: ${this.settings.PanelMargin}px;`;
                    else {
                        panel.actor.style += `margin-bottom: ${Math.max(this.settings.PanelMargin, panel.margin_bottom)}px;`;
                        panel.actor.style += `margin-top: ${this.settings.PanelMargin}px;`;
                    }
                    if (panel.panelPosition == imports.ui.panel.PanelLoc.top || panel.panelPosition == imports.ui.panel.PanelLoc.bottom)
                        panel.actor.style += `padding-left: ${this.settings.PanelPadding}px; padding-right: ${this.settings.PanelPadding}px;`;
                    else {
                        panel.actor.style += `padding-bottom: ${this.settings.PanelPadding}px;`;
                        panel.actor.style += `padding-top: ${this.settings.PanelPadding}px;`;
                    }
                }
            }
        };
        this.RestoreOriginalStyle = () => {
            for (const panel of panelManager.getPanels()) {
                if (panel == null)
                    continue;
                panel.actor.style = this.originalPanelStyles[panel.panelId];
            }
            this.originalPanelStyles = [];
        };
        this.settings = new Config(this);
    }
    Enable() {
        this.enabled = true;
        this.settings.Enable();
        this.ApplyStyles();
        this.panelsChangedKey = global.settings.connect("changed::panels-enabled", () => {
            this.ApplyStyles();
        });
        global.settings.connect("changed::panel-edit-mode", () => {
            this.ApplyStyles();
        });
    }
    Disable() {
        this.settings.Disable();
        this.RestoreOriginalStyle();
        if (this.panelsChangedKey != null) {
            global.settings.disconnect(this.panelsChangedKey);
            this.panelsChangedKey = null;
        }
    }
}
let app;
const init = (meta) => {
    app = new Extension();
};
const enable = () => {
    app.Enable();
};
const disable = () => {
    app.Disable();
};

extraPanelSettings = __webpack_exports__;
/******/ })()
;