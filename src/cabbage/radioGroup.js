// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import { widgets } from "./sharedState.js";
import { Cabbage } from "../cabbage/cabbage.js";
import { CabbageUtils } from "../cabbage/utils.js";

/**
 * Handle radio group logic: when a widget is activated, deactivate all others in the same group.
 * @param {string|number} radioGroup - The radioGroup identifier
 * @param {string} activeChannel - The channel of the widget that was just activated
 */
export function handleRadioGroup(radioGroup, activeChannel) {
    if (!radioGroup || radioGroup === -1) return;

    console.log(`Cabbage: Handling radioGroup ${radioGroup} for channel ${activeChannel}`);

    // Find all widgets in the same radioGroup
    const groupWidgets = widgets.filter(widget =>
        widget.props.radioGroup === radioGroup && widget.props.channel !== activeChannel
    );

    // Deactivate all other widgets in the group
    groupWidgets.forEach(groupWidget => {
        if (groupWidget.props.value !== 0) {
            groupWidget.props.value = 0;

            // Update visual state
            const groupChannelId = typeof groupWidget.props.channel === 'object' && groupWidget.props.channel !== null
                ? (groupWidget.props.channel.id || groupWidget.props.channel.x)
                : groupWidget.props.channel;
            const widgetDiv = document.getElementById(groupChannelId);
            if (widgetDiv) {
                widgetDiv.innerHTML = groupWidget.getInnerHTML();
                // Send update to host
                const msg = {
                    paramIdx: groupWidget.parameterIndex,
                    channel: CabbageUtils.getChannelId(groupWidget.props),
                    value: 0
                };
                Cabbage.sendChannelUpdate(msg, groupWidget.vscode || null, groupWidget.props.automatable);
            }
        }
    });
}