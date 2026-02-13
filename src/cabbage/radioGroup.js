// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import { widgets } from "./sharedState.js";
import { Cabbage } from "../cabbage/cabbage.js";
import { CabbageUtils } from "../cabbage/utils.js";

/**
 * Handle radio group logic: when a widget is activated, deactivate all others in the same group.
 * @param {string|number} radioGroup - The radioGroup identifier
 * @param {string} activeWidgetId - The div ID of the widget that was just activated
 */
export function handleRadioGroup(radioGroup, activeWidgetId) {
    if (!radioGroup || radioGroup === -1) return;


    // Find all widgets in the same radioGroup
    const groupWidgets = widgets.filter(widget =>
        widget.props.radioGroup == radioGroup && CabbageUtils.getWidgetDivId(widget.props) !== activeWidgetId
    );


    // Deactivate all other widgets in the group
    groupWidgets.forEach(groupWidget => {
        const channelId = CabbageUtils.getChannelId(groupWidget.props, 0);

        if (groupWidget.props.value !== 0) {
            groupWidget.props.value = 0;

            // Update visual state
            const widgetDiv = CabbageUtils.getWidgetDiv(groupWidget.props);
            if (widgetDiv) {
                widgetDiv.innerHTML = groupWidget.getInnerHTML();
                // Send update to host
                Cabbage.sendControlData({ channel: channelId, value: 0, gesture: "complete" }, groupWidget.vscode || null);
            }
        }
    });
}