const { tiling } = require('./tiling');

/**
 * called when extension is loaded
 */
function init(metadata) {
    //extensionMeta holds your metadata.json info
    tiling.init(metadata);
}

/**
 * called when extension is loaded
 */
function enable() {
    tiling.enable();
}

/**
 * called when extension gets disabled
 */
function disable() {
    tiling.disable();
}