var tiling;
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
  "disable": () => (/* binding */ disable),
  "enable": () => (/* binding */ enable),
  "init": () => (/* binding */ init)
});

;// CONCATENATED MODULE: ./signalManager.ts
class SignalManager {
    constructor() {
        this.connectedSignals = new Map();
    }
    Connect(object, signal) {
        if (!this.connectedSignals.has(object))
            this.connectedSignals.set(object, []);
        this.connectedSignals.get(object).push(signal);
    }
    Disconnect(object, signal) {
        if (!this.connectedSignals.has(object))
            return;
        const signals = this.connectedSignals.get(object);
        const signalIndex = signals.findIndex((v => v == signal));
        if (signalIndex == -1)
            return;
        signals.splice(signalIndex, 1);
        object.disconnect(signal);
    }
    Destroy() {
        for (const [object, signals] of this.connectedSignals) {
            for (const signal of signals) {
                object.disconnect(signal);
            }
        }
    }
}

;// CONCATENATED MODULE: ./utils.ts
const { panelManager } = imports.ui.main;
const { PanelLoc } = imports.ui.panel;
const { Rectangle } = imports.gi.Meta;
const getUsableScreenArea = (monitor) => {
    let top = monitor.y;
    let bottom = monitor.y + monitor.height;
    let left = monitor.x;
    let right = monitor.x + monitor.width;
    for (let panel of panelManager.getPanelsInMonitor(monitor.index)) {
        if (!panel.isHideable()) {
            switch (panel.panelPosition) {
                case PanelLoc.top:
                    top += getPanelHeight(panel);
                    break;
                case PanelLoc.bottom:
                    bottom -= getPanelHeight(panel);
                    break;
                case PanelLoc.left:
                    left += getPanelHeight(panel);
                    break;
                case PanelLoc.right:
                    right -= getPanelHeight(panel);
                    break;
            }
        }
    }
    let width = right > left ? right - left : 0;
    let height = bottom > top ? bottom - top : 0;
    return new Rectangle({
        x: left,
        y: top,
        width: width,
        height: height
    });
};
const getPanelHeight = (panel) => {
    return panel.height
        || panel.actor.get_height();
};

;// CONCATENATED MODULE: ./tiler.ts


const { WindowTracker } = imports.gi.Cinnamon;
const { layoutManager, keybindingManager } = imports.ui.main;
const { WindowManager } = imports.ui.windowManager;
const { MonitorManager, MaximizeFlags } = imports.gi.Meta;
var Direction;
(function (Direction) {
    Direction[Direction["LEFT"] = 0] = "LEFT";
    Direction[Direction["RIGHT"] = 1] = "RIGHT";
    Direction[Direction["UP"] = 2] = "UP";
    Direction[Direction["DOWN"] = 3] = "DOWN";
})(Direction || (Direction = {}));
const WINDOW_RESIZE_STEP = 1 / 20;
class App {
    constructor() {
        this.tracker = WindowTracker.get_default();
        this.monitorManager = MonitorManager.get();
        this.windowManager = global.window_manager;
        this.signals = new SignalManager();
        this.skip_transition = false;
        this.AddKeybindings = () => {
            keybindingManager.addHotKey('tiling-resize-down', "<Primary><Super>Down::", () => this.ResizeWindow(this.currentWindow, Direction.DOWN));
            keybindingManager.addHotKey('tiling-resize-up', "<Primary><Super>Up::", () => this.ResizeWindow(this.currentWindow, Direction.UP));
            keybindingManager.addHotKey('tiling-resize-left', "<Primary><Super>Left::", () => this.ResizeWindow(this.currentWindow, Direction.LEFT));
            keybindingManager.addHotKey('tiling-resize-right', "<Primary><Super>Right::", () => this.ResizeWindow(this.currentWindow, Direction.RIGHT));
        };
        this.RemoveKeybindings = () => {
            keybindingManager.removeHotKey('tiling');
        };
        this.OnFocusedWindowChanged = () => {
            this.currentWindow = global.display.focus_window;
        };
        this.ResizeWindow = (window, direction) => {
            const monitor = window.get_monitor();
            const monitorSizes = getUsableScreenArea(layoutManager.monitors[monitor]);
            const windowSizes = window.get_frame_rect();
            let offset;
            if (direction == Direction.DOWN || direction == Direction.UP)
                offset = monitorSizes.height * WINDOW_RESIZE_STEP;
            else
                offset = monitorSizes.width * WINDOW_RESIZE_STEP;
            this.skip_transition = true;
            window.unmaximize(MaximizeFlags.HORIZONTAL);
            window.unmaximize(MaximizeFlags.VERTICAL);
            window.unmaximize(MaximizeFlags.HORIZONTAL | MaximizeFlags.VERTICAL);
            this.skip_transition = false;
            switch (direction) {
                case Direction.LEFT:
                    window.move_resize_frame(true, windowSizes.x, windowSizes.y, windowSizes.width - offset, windowSizes.height);
                    break;
                case Direction.RIGHT: {
                    const distanceFromMonitorEdge = (monitorSizes.x + monitorSizes.width) - (windowSizes.x + windowSizes.width + offset);
                    let width = windowSizes.width + offset;
                    if (distanceFromMonitorEdge < 0)
                        width += distanceFromMonitorEdge;
                    window.move_resize_frame(true, windowSizes.x, windowSizes.y, width, windowSizes.height);
                    break;
                }
                case Direction.UP:
                    window.move_resize_frame(true, windowSizes.x, windowSizes.y, windowSizes.width, windowSizes.height - offset);
                    break;
                case Direction.DOWN: {
                    const distanceFromMonitorEdge = (monitorSizes.y + monitorSizes.height) - (windowSizes.y + windowSizes.height + offset);
                    let height = windowSizes.height + offset;
                    if (distanceFromMonitorEdge < 0)
                        height += distanceFromMonitorEdge;
                    window.move_resize_frame(true, windowSizes.x, windowSizes.y, windowSizes.width, height);
                    break;
                }
            }
        };
        this.MoveWindow = (window, direction) => {
            window.get_monitor();
        };
        this.currentWindow = global.display.focus_window;
        global.window_manager.connect("size-changed", (vm, actor) => {
            if (this.skip_transition) {
                actor.remove_all_transitions();
                actor.scale_x = 1.0;
                actor.scale_y = 1.0;
                actor.translation_x = 0;
                actor.translation_y = 0;
            }
        });
        this.signals.Connect(this.tracker, this.tracker.connect("notify::focus-app", this.OnFocusedWindowChanged));
        this.AddKeybindings();
    }
    Destroy() {
        this.signals.Destroy();
        this.RemoveKeybindings();
    }
}

;// CONCATENATED MODULE: ./extension.ts

let metadata;
let app;
const init = (meta) => {
    metadata = meta;
};
const enable = () => {
    app = new App();
};
const disable = () => {
    app.Destroy();
};

tiling = __webpack_exports__;
/******/ })()
;