"use strict";
exports.id = 1;
exports.ids = [1];
exports.modules = {

/***/ 45:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WidgetWrapper: () => (/* binding */ WidgetWrapper)
/* harmony export */ });
/**
 * This is a wrapper for all widgets. It provides the drag and drop functionality
 * for the UI designer
 */
class WidgetWrapper {
    constructor(updatePanelCallback, selectedSet, widgets, vscode) {
        const restrictions = {
            restriction: 'parent',
            endOnly: true
        };
        this.snapSize = 2;
        this.selectedElements = selectedSet;
        this.updatePanelCallback = updatePanelCallback;
        this.dragMoveListener = this.dragMoveListener.bind(this);
        this.dragEndListener = this.dragEndListener.bind(this);
        this.widgets = widgets;
        this.vscode = vscode;
        this.applyInteractConfig(restrictions);
    }

    dragMoveListener(event) {
        if (event.shiftKey || event.altKey) {
            return;
        }

        const { dx, dy } = event;
        this.selectedElements.forEach(element => {
            const x = (parseFloat(element.getAttribute('data-x')) || 0) + dx;
            const y = (parseFloat(element.getAttribute('data-y')) || 0) + dy;

            element.style.transform = `translate(${x}px, ${y}px)`;
            element.setAttribute('data-x', x);
            element.setAttribute('data-y', y);
        });
    }

    dragEndListener(event) {
        const { dx, dy } = event;

        this.selectedElements.forEach(element => {

            const x = (parseFloat(element.getAttribute('data-x')) || 0) + dx;
            const y = (parseFloat(element.getAttribute('data-y')) || 0) + dy;

            element.style.transform = `translate(${x}px, ${y}px)`;
            element.setAttribute('data-x', x);
            element.setAttribute('data-y', y);
            this.updatePanelCallback(this.vscode, { eventType: "move", name: element.id, bounds: { x: x, y: y, w: -1, h: -1 } },this.widgets);


            // console.log(`Drag ended for element ${element.id}: x=${x}, y=${y}`); // Logging drag end details
        });
    }

    applyInteractConfig(restrictions) {
        interact('.draggable').unset(); // Unset previous interact configuration

        interact('.draggable').on('down', (event) => {

            if (this.selectedElements.size <= 1) {
            //     if (event.target.id) {
            //         this.updatePanelCallback(this.vscode, {eventType:"click", name:event.target.id, bounds:{}},this.widgets);
            //     } else {
            //         const widgetId = event.target.parentElement.parentElement.id.replace(/(<([^>]+)>)/ig, '');
            //         this.updatePanelCallback(this.vscode, {eventType:"click", name:widgetId, bounds:{}},this.widgets);
            //     }
            }
        }).resizable({
            edges: { left: false, right: true, bottom: true, top: false },
            listeners: {
                move: (event) => {
                    if (event.shiftKey || event.altKey) {
                        return;
                    }
                    const target = event.target;
                    restrictions.restriction = (target.id === 'MainForm' ? 'none' : 'parent');
                    let x = (parseFloat(target.getAttribute('data-x')) || 0);
                    let y = (parseFloat(target.getAttribute('data-y')) || 0);

                    target.style.width = event.rect.width + 'px';
                    target.style.height = event.rect.height + 'px';

                    x += event.deltaRect.left;
                    y += event.deltaRect.top;

                    this.updatePanelCallback(this.vscode, { eventType: "resize", name: event.target.id, bounds: { x: x, y: y, w: event.rect.width, h: event.rect.height } },this.widgets);

                    target.style.transform = 'translate(' + x + 'px,' + y + 'px)';

                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                }
            },
            modifiers: [
                interact.modifiers.restrictRect(restrictions),
                // interact.modifiers.restrictSize({
                //     min: { width: 10, height: 10 }
                // }),
                interact.modifiers.snap({
                    targets: [
                        interact.snappers.grid({ x: this.snapSize, y: this.snapSize })
                    ],
                    range: Infinity,
                    relativePoints: [{ x: 0, y: 0 }]
                }),
            ],
            inertia: true
        }).draggable({
            startThreshold: 1,
            listeners: {
                move: this.dragMoveListener,
                end: this.dragEndListener
            },
            inertia: true,
            modifiers: [
                interact.modifiers.snap({
                    targets: [
                        interact.snappers.grid({ x: this.snapSize, y: this.snapSize })
                    ],
                    range: Infinity,
                    relativePoints: [{ x: 0, y: 0 }]
                }),
                interact.modifiers.restrictRect(restrictions),
            ]
        });

        //main form only..........
        interact('.resizeOnly').on('down', (event) => {
        }).draggable(false).resizable({
            edges: { left: true, right: true, bottom: true, top: true }, // Enable resizing from all edges
            listeners: {
                move: (event) => {
                    if (event.shiftKey || event.altKey) {
                        return;
                    }
                    const target = event.target;
                    restrictions.restriction = (target.id === 'MainForm' ? 'none' : 'parent');
                    let x = (parseFloat(target.getAttribute('data-x')) || 0);
                    let y = (parseFloat(target.getAttribute('data-y')) || 0);

                    target.style.width = event.rect.width + 'px';
                    target.style.height = event.rect.height + 'px';

                    x += event.deltaRect.left;
                    y += event.deltaRect.top;

                    this.updatePanelCallback(this.vscode, { eventType: "resize", name: event.target.id, bounds: { x: x, y: y, w: event.rect.width, h: event.rect.height } },this.widgets);

                    target.style.transform = 'translate(' + x + 'px,' + y + 'px)';

                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                }
            },
            modifiers: [
                // interact.modifiers.restrictSize({
                //     min: { width: 10, height: 10 }, // Minimum size for the element
                //     max: { width: 1500, height: 1500 } // Maximum size for the element
                // })
            ],
            inertia: true
        });

    }

    setSnapSize(size) {
        this.snapSize = size;
        this.applyInteractConfig({
            restriction: 'parent',
            endOnly: true
        });
    }
}

/*
This is a simple panel that the main form sits on. It can be dragged around without restriction
*/
interact('.draggablePanel')
    .draggable({
        inertia: true,
        autoScroll: true,
        onmove: formDragMoveListener
    });

function formDragMoveListener(event) {

    var target = event.target;
    if (event.shiftKey || event.altKey) {
        return;
    }
    // keep the dragged position in the data-x/data-y attributes
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // translate the element
    target.style.webkitTransform =
        target.style.transform =
        'translate(' + x + 'px, ' + y + 'px)';

    // update the position attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}





/***/ })

};
;
//# sourceMappingURL=1.extension.js.map