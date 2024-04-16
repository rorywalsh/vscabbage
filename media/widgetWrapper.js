
/**
 * This class is a wrapper for our draggable widgets. Each div with class type 'resize-drag' will be controlled by this
 * class. The constructor is passed a callback which will be triggered each time the user modify a widget's size or position.
 * The callback will update the property panel.
 */
export class WidgetWrapper {

    constructor(updatePanelCallback) {
        const restrictions = {
            restriction: 'parent',
            endOnly: true
        };


        function dragMoveListener(event) {
            var target = event.target
            // keep the dragged position in the data-x/data-y attributes
            var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
            var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy
            // translate the element
            target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'
            updatePanelCallback("drag", event.target.id, { x: x, y: y, w: event.rect.width, h: event.rect.height });
            target.setAttribute('data-x', x)
            target.setAttribute('data-y', y)
            restrictions.restriction = (target.id === 'MainForm' ? 'none' : 'parent');
        }

        interact('.resize-drag')
            .resizable({
                // resize from all edges and corners
                edges: { left: true, right: true, bottom: true, top: true },

                listeners: {
                    move(event) {
                        var target = event.target
                        restrictions.restriction = (target.id === 'MainForm' ? 'none' : 'parent');
                        console.log(restrictions.restriction);
                        var x = (parseFloat(target.getAttribute('data-x')) || 0)
                        var y = (parseFloat(target.getAttribute('data-y')) || 0)


                        // update the element's style
                        target.style.width = event.rect.width + 'px'
                        target.style.height = event.rect.height + 'px'

                        // translate when resizing from top or left edges
                        x += event.deltaRect.left
                        y += event.deltaRect.top

                        updatePanelCallback("resize", event.target.id, { x: x, y: y, w: event.rect.width, h: event.rect.height });

                        target.style.transform = 'translate(' + x + 'px,' + y + 'px)'

                        target.setAttribute('data-x', x)
                        target.setAttribute('data-y', y)
                        // target.textContent = Math.round(event.rect.width) + '\u00D7' + Math.round(event.rect.height)
                    }
                },
                modifiers: [
                    // keep the edges inside the parent
                    interact.modifiers.restrictRect(restrictions),

                    // minimum size
                    interact.modifiers.restrictSize({
                        min: { width: 100, height: 50 }
                    })
                ],

                inertia: true
            }).draggable({
                listeners: {
                    move: dragMoveListener
                },
                inertia: true,
                modifiers: [
                    interact.modifiers.restrictRect(restrictions)
                ]
            }).on('down', function (event) {
                console.log(event.target);
                if (event.target.id) //form
                    updatePanelCallback("click", event.target.id, {});
                else{ //all widgets placed on form
                    const widgetId = event.target.parentElement.parentElement.id.replace(/(<([^>]+)>)/ig);
                    updatePanelCallback("click", widgetId, {});
                }
            })
    }
}