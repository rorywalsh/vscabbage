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

    console.log(`Cabbage: Handling radioGroup ${radioGroup} for widget ${activeWidgetId}`);

    // Find all widgets in the same radioGroup
    const groupWidgets = widgets.filter(widget =>
        widget.props.radioGroup == radioGroup && CabbageUtils.getWidgetDivId(widget.props) !== activeWidgetId
    );

    console.log(`Cabbage: Found ${groupWidgets.length} other widgets in radioGroup ${radioGroup} to deactivate`);

    // Deactivate all other widgets in the group
    groupWidgets.forEach(groupWidget => {
        const channelId = CabbageUtils.getChannelId(groupWidget.props, 0);
        console.log(`Cabbage: Deactivating widget ${CabbageUtils.getWidgetDivId(groupWidget.props)}, channel: ${channelId}, current value: ${groupWidget.props.value}`);

        if (groupWidget.props.value !== 0) {
            groupWidget.props.value = 0;

            // Update visual state
            const widgetDiv = CabbageUtils.getWidgetDiv(groupWidget.props);
            if (widgetDiv) {
                widgetDiv.innerHTML = groupWidget.getInnerHTML();
                // Send update to host
                console.log(`Cabbage: Sending channel update for ${channelId}:`, 0);
                Cabbage.sendControlData({ channel: channelId, value: 0, gesture: "complete" }, groupWidget.vscode || null);
            }
        }
    });
}