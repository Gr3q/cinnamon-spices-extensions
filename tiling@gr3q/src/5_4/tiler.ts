import { SignalManager } from "./signalManager";
import { getUsableScreenArea } from "./utils";

const { WindowTracker } = imports.gi.Cinnamon;
const { layoutManager, keybindingManager } = imports.ui.main;
const { WindowManager } = imports.ui.windowManager;
const { MonitorManager, MaximizeFlags } = imports.gi.Meta;


enum Direction {
    LEFT,
    RIGHT,
    UP,
    DOWN
}

/* Percent of monitor height/width */
const WINDOW_RESIZE_STEP = 1/20;

export class App {

    public readonly tracker = WindowTracker.get_default();
    private readonly monitorManager = MonitorManager.get();
    private readonly windowManager = global.window_manager;
    private signals = new SignalManager();
    private currentWindow: imports.gi.Meta.Window;
    private skip_transition: boolean = false;
    // private currentMonitor: number;

	public constructor() {
        this.currentWindow = global.display.focus_window;
        global.window_manager.connect("size-changed", (vm, actor) => {
            if (this.skip_transition) {
                actor.remove_all_transitions();
                actor.scale_x = 1.0;
                actor.scale_y = 1.0;
                actor.translation_x = 0;
                actor.translation_y = 0;
            }
        })
        // this.currentMonitor = global.screen.get_current_monitor();
        this.signals.Connect(this.tracker, this.tracker.connect("notify::focus-app", this.OnFocusedWindowChanged));
        // this.signals.Connect(this.monitorManager, this.monitorManager.connect('monitors-changed', this.OnMonitorsChanged));
        this.AddKeybindings();
	}

    private AddKeybindings = () => {
        keybindingManager.addHotKey('tiling-resize-down',   "<Primary><Super>Down::", () => this.ResizeWindow(this.currentWindow, Direction.DOWN));
        keybindingManager.addHotKey('tiling-resize-up',     "<Primary><Super>Up::", () => this.ResizeWindow(this.currentWindow, Direction.UP));
        keybindingManager.addHotKey('tiling-resize-left',   "<Primary><Super>Left::", () => this.ResizeWindow(this.currentWindow, Direction.LEFT));
        keybindingManager.addHotKey('tiling-resize-right',  "<Primary><Super>Right::", () => this.ResizeWindow(this.currentWindow, Direction.RIGHT));
    }

    private RemoveKeybindings = () => {
        keybindingManager.removeHotKey('tiling');
    }


    public Destroy() {
        this.signals.Destroy();
        this.RemoveKeybindings();
	}

    private OnFocusedWindowChanged = () => {
        this.currentWindow = global.display.focus_window;
    }

    private ResizeWindow = (window: imports.gi.Meta.Window, direction: Direction) => {
        const monitor = window.get_monitor();
        const monitorSizes = getUsableScreenArea(layoutManager.monitors[monitor]);
        const windowSizes = window.get_frame_rect();

        let offset: number;
        if (direction == Direction.DOWN || direction == Direction.UP)
            offset = monitorSizes.height * WINDOW_RESIZE_STEP;
        else
            offset = monitorSizes.width * WINDOW_RESIZE_STEP;

        this.skip_transition = true;
        window.unmaximize(MaximizeFlags.HORIZONTAL);
        window.unmaximize(MaximizeFlags.VERTICAL);
        window.unmaximize(MaximizeFlags.HORIZONTAL | MaximizeFlags.VERTICAL);
        this.skip_transition = false;

        switch(direction) {
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
    }

    private MoveWindow = (window: imports.gi.Meta.Window, direction: Direction) => {
        window.get_monitor();

    }

    //#region Utilities
}