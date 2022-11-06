const { panelManager } = imports.ui.main;
const { PanelLoc } = imports.ui.panel;
const { Rectangle } = imports.gi.Meta;

export const getUsableScreenArea = (monitor: imports.ui.layout.Monitor): imports.gi.Meta.Rectangle => {
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
                    left += getPanelHeight(panel); // even vertical panels use 'height'
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
}

const getPanelHeight = (panel: imports.ui.panel.Panel) => {
    return panel.height
        || panel.actor.get_height();  // fallback for old versions of Cinnamon
}