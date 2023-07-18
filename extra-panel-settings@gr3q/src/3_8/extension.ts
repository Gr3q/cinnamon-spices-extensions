import { Config } from "./config";

const { panelManager } = imports.ui.main;

export class Extension {

  originalPanelStyles: string[] = [];
  enabled: boolean = false;
  settings: Config;
  panelsChangedKey: number | null = null;

  constructor() {
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

  ApplyStyles = () => {
    if (this.settings.PanelFont == null) {
      this.RestoreOriginalStyle();
    }
    else {
      for (const panel of panelManager.getPanels()) {
        if (panel == null)
          continue;
        
        // Backup original styles the first time we plan to modify the panel
        if (this.originalPanelStyles[panel.panelId] == null) {
          this.originalPanelStyles[panel.panelId] = panel.actor.style;
        }

        const panelEditMode = global.settings.get_boolean("panel-edit-mode")
        
        panel.actor.style = (this.originalPanelStyles[panel.panelId] ?? "");
        panel.actor.style += `font-family: ${this.settings.PanelFont};`;
        panel.actor.style += `font-size: ${this.settings.PanelFontSize}px;`;
        panel.actor.style += `background-color: ${this.settings.PanelColor};`;
        panel.actor.style += `border-radius: ${this.settings.PanelBorderRadius}px;`;
        panel.actor.style += `margin-left: ${this.settings.PanelMargin}px; margin-right: ${this.settings.PanelMargin}px;`;
        panel.actor.style += `padding-left: ${this.settings.PanelPadding}px; padding-right: ${this.settings.PanelPadding}px;`;
      }
    }
  }

  RestoreOriginalStyle = () => {
    for (const panel of panelManager.getPanels()) {
      if (panel == null)
        continue;
      panel.actor.style = this.originalPanelStyles[panel.panelId]
    }
    this.originalPanelStyles = [];
  }
}

/*****************************************************************
                            FUNCTIONS
*****************************************************************/

let app!: Extension; 

export const init = (meta: any) => {
  app = new Extension();
}

export const enable = () => {
  app.Enable();
}

export const disable = () => {
  // Key Bindings
  app.Disable()
}