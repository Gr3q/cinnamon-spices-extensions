import { App } from "../extension";
import { addSignals, isFinalized, SignalOverload } from "../utils";
import { Grid } from "./Grid";
import { GridElementDelegate } from "./GridElementDelegate";
const Main = imports.ui.main;
const { Button, Bin, BoxLayout, Align } = imports.gi.St;
const { Color } = imports.gi.Clutter;
const { Cursor, util_get_transformed_allocation } = imports.gi.Cinnamon;


export interface ResizeEvent {
    event: imports.gi.Clutter.MotionEvent;
    absoluteActorBox: imports.gi.Clutter.ActorBox;
    delta: [x: number, y: number];
    side: imports.gi.Cinnamon.Cursor;
}

export interface GridElement {
    connect(signal: "resize-request", callback: (element: GridElement, actor: imports.gi.Clutter.Actor, event: ResizeEvent, coordx: number, coordy: number) => void): number;
    disconnect(signalID: number): void;
    emit(signal: "resize-request", actor: imports.gi.Clutter.Actor, event: ResizeEvent, coordx: number, coordy: number): void;
}

@addSignals
export class GridElement {
    button: imports.gi.St.Button;
    actor: imports.gi.St.BoxLayout;
    monitor: imports.ui.layout.Monitor;
    coordx: number;
    coordy: number;
    width: number;
    height: number;
    active: boolean;
    delegate: GridElementDelegate;
    private app: App;
    private grid: Grid;
    private buttonHovered = false;
    private edgePressed = false;
    private currentCursor: imports.gi.Cinnamon.Cursor | null = null;
    private prevMotionEvent: imports.gi.Clutter.MotionEvent | null = null;

    private set Cursor(val: imports.gi.Cinnamon.Cursor | null) {
        if (this.currentCursor === val) {
            return;
        }

        this.currentCursor = val;

        if (val == null) {
            global.unset_cursor();
        }
        else {
            global.set_cursor(val);
        }
    }

    constructor(app: App, grid: Grid, monitor: imports.ui.layout.Monitor, width: number, height: number, coordx: number, coordy: number, delegate: GridElementDelegate) {
        this.app = app;
        this.grid = grid;
        this.actor = new BoxLayout({
            style_class: 'table-element',
            width: width,
            height: height,
            x_expand: false,
            y_expand: false,
            reactive: true,
            can_focus: true,
            track_hover: true,
        });
        this.button = new Button({
            style_class: 'table-button',
            reactive: true,
        });

        this.actor.add(this.button, { expand: true });

        this.monitor = monitor;
        this.coordx = coordx;
        this.coordy = coordy;
        this.width = width;
        this.height = height;
        this.delegate = delegate;

        this.button.connect(
            'button-press-event',
            (owner, e) => this._onButtonPress(false)
        );
        this.actor.connect(
            'notify::hover',
            this._onHoverChanged
        );

        this.button.connect("enter-event", this.onSelectAreaHover);
        this.button.connect("leave-event", this.onSelectAreaHoverLeave);
        this.grid.table.connect("motion-event", this.onEdgeMotion);
        this.actor.connect("enter-event", this.onEdgeHover);
        this.actor.connect("leave-event", this.onEdgeHoverLeave);
        this.actor.connect("button-press-event", (a, e) => { global.log("OnButtonPress"); this.edgePressed = true; return false;});
        this.actor.connect("button-release-event", (a, e) => { global.log("onRelease"); this.edgePressed = false; return false;});

        this.active = false;
    }

    private onEdgeMotion = (actor: imports.gi.St.Widget, event: imports.gi.Clutter.MotionEvent) => {
        if (this.edgePressed) {
            if (this.prevMotionEvent != null) {
                const eventPoint = event.get_coords();
                const oldEventPoint = this.prevMotionEvent.get_coords();
                this.emit("resize-request", this.actor, {
                    event: event,
                    absoluteActorBox: this.actor.get_allocation_box(),
                    delta: [eventPoint[0] - oldEventPoint[0], eventPoint[1] - oldEventPoint[1]],
                    side: this.currentCursor!,
                }, this.coordx, this.coordy);
                global.log("onEdgeMotionEventFired", [eventPoint[0] - oldEventPoint[0], eventPoint[1] - oldEventPoint[1]]);
            }
            this.prevMotionEvent = event;
        }
        else if (!this.buttonHovered) {
            const actorBox = util_get_transformed_allocation(this.actor);
            const eventPoint = event.get_coords();
            this.SetCursor(actorBox, eventPoint);
        }
        return false;
    }

    private onEdgeHover = (actor: imports.gi.St.BoxLayout, event: imports.gi.Clutter.CrossingEvent) => {
        global.log("onEdgeHover");
        if (!this.actor || isFinalized(this.actor)) return false;

        const actorBox = util_get_transformed_allocation(this.actor);
        const eventPoint = event.get_coords();
        this.SetCursor(actorBox, eventPoint);
        return false;
    }

    private onEdgeHoverLeave = (actor: imports.gi.St.BoxLayout, event: imports.gi.Clutter.CrossingEvent) => {
        global.log("onEdgeHoverLeave");
        if (!this.edgePressed) {
            this.prevMotionEvent = null;
            this.Cursor = null;
        }
        return false;
    }

    private onSelectAreaHover = (actor: imports.gi.St.Button, event: imports.gi.Clutter.CrossingEvent) => {
        global.log("buttonHovered")
        if (!this.button || isFinalized(this.button)) return false;
        this.buttonHovered = true;
        return false;
    }

    private onSelectAreaHoverLeave = (actor: imports.gi.St.Button, event: imports.gi.Clutter.CrossingEvent) => {
        this.buttonHovered = false;
        return false;
    }

    private SetCursor = (absActorBox: imports.gi.Clutter.ActorBox, eventPoint: [x: number, y: number]) => {
        const leftDistance = Math.abs(eventPoint[0] - absActorBox.x1);
        const rightDistance = Math.abs(eventPoint[0] - absActorBox.x2);
        const topDistance = Math.abs(eventPoint[1] - absActorBox.y1);
        const bottomDistance = Math.abs(eventPoint[1] - absActorBox.y2);

        const actorCornerAreaWidth = (absActorBox.x2 - absActorBox.x1) / 10;
        const actorCornerAreaHeight = (absActorBox.y2 - absActorBox.y1) / 10;

        const nbCols = this.app.config.nbCols.length;
        const nbRows = this.app.config.nbRows.length;

        const canAdjustRight = nbCols > 1 && this.coordx < nbCols - 1;
        const canAdjustLeft = this.coordx > 0;
        const canAdjustTop = nbRows > 1 && this.coordy < nbRows - 1;
        const canAdjustBottom = this.coordy > 0;

        const smallestDistance = Math.min(leftDistance, rightDistance, topDistance, bottomDistance);
        let cursor: imports.gi.Cinnamon.Cursor | null = null;

        // Corners
        if (leftDistance < actorCornerAreaWidth && topDistance < actorCornerAreaHeight && canAdjustTop && canAdjustLeft) {
            cursor = Cursor.RESIZE_TOP_LEFT;
        }
        else if (rightDistance < actorCornerAreaWidth && topDistance < actorCornerAreaHeight && canAdjustTop && canAdjustRight) {
            cursor = Cursor.RESIZE_TOP_RIGHT;
        }
        else if (leftDistance < actorCornerAreaWidth && bottomDistance < actorCornerAreaHeight && canAdjustBottom && canAdjustLeft) {
            cursor = Cursor.RESIZE_BOTTOM_LEFT;
        }
        else if (rightDistance < actorCornerAreaWidth && bottomDistance < actorCornerAreaHeight && canAdjustBottom && canAdjustRight) {
            cursor = Cursor.RESIZE_BOTTOM_RIGHT;
        }
        // Sides
        else if (smallestDistance === leftDistance && canAdjustLeft) {
            cursor = Cursor.RESIZE_LEFT;
        } 
        else if (smallestDistance === rightDistance && canAdjustRight) {
            cursor = Cursor.RESIZE_RIGHT;
        } 
        else if (smallestDistance === topDistance && canAdjustTop) {
            cursor = Cursor.RESIZE_TOP;
        }
        else if (smallestDistance === bottomDistance && canAdjustBottom) {
            cursor = Cursor.RESIZE_BOTTOM;
        }

        this.Cursor = cursor;
    }

    public _onButtonPress = (final: boolean) => {
        this.delegate._onButtonPress(this, final);
        return false;
    }

    public _onHoverChanged = () => {
        if (!this.actor || isFinalized(this.actor)) return;

        this.delegate._onHoverChanged(this);
        return false;
    }

    public _activate = () => {
        if (!this.actor || isFinalized(this.actor)) return;
        this.actor.add_style_pseudo_class('activate');
    }

    public _deactivate = () => {
        if (!this.actor || isFinalized(this.actor)) return;
        this.actor.remove_style_pseudo_class('activate');
    }

    public _clean = () => {
        Main.uiGroup.remove_actor(this.app.area);
    }

    public _destroy = () => {
        // @ts-ignore
        this.monitor = null;
        // @ts-ignore
        this.coordx = null;
        // @ts-ignore
        this.coordy = null;
        // @ts-ignore
        this.width = null;
        // @ts-ignore
        this.height = null;
        // @ts-ignore
        this.active = null;
    }
}