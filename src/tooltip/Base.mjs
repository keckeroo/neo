import Container from '../container/Base.mjs';
import Floating  from '../util/Floating.mjs';
import Label     from '../component/Label.mjs';

/**
 * Base class for component tooltips
 * @class Neo.tooltip.Base
 * @extends Neo.container.Base
 */
class Base extends Container {
    static getConfig() {return {
        /**
         * @member {String} className='Neo.tooltip.Base'
         * @protected
         */
        className: 'Neo.tooltip.Base',
        /**
         * @member {String} ntype='tooltip'
         * @protected
         */
        ntype: 'tooltip',
        /**
         * @member {String[]} cls=['neo-tooltip']
         */
        cls: ['neo-tooltip'],
        /**
         * A reference to the target component which is supposed to show this tooltip on mouseenter
         * @member {String|null} componentId_=null
         */
        componentId_: null,
        /**
         * Delegates down to a CSS selector inside the target component
         * @member {String|null} delegate=null
         */
        delegate: null,
        /**
         * The delay in ms before the tooltip gets hidden while hovering the target element.
         * Use null to disable the dismiss logic.
         * @member {Number|null} dismissDelay=10000
         */
        dismissDelay: 10000,
        /**
         * The dismissDelay task id generated by setTimeout()
         * @member {Number|null} dismissDelayTaskId=null
         * @protected
         */
        dismissDelayTaskId: null,
        /**
         * The delay in ms before the tooltip gets shown
         * @member {Number|null} hideDelay=400
         */
        hideDelay: 400,
        /**
         * The showDelay task id generated by setTimeout()
         * @member {Number|null} hideDelayTaskId=null
         * @protected
         */
        hideDelayTaskId: null,
        /**
         * @member {Array} mixins
         * @protected
         */
        mixins: [Floating],
        /**
         * The delay in ms before the tooltip gets shown
         * @member {Number|null} showDelay=200
         */
        showDelay: 200,
        /**
         * The showDelay task id generated by setTimeout()
         * @member {Number|null} showDelayTaskId=null
         * @protected
         */
        showDelayTaskId: null,
        /**
         * True prevents the tooltip from hiding while the mouse cursor is above it
         * @member {Boolean|null} stayOnHover_=true
         */
        stayOnHover_: true,
        /**
         * Shortcut to add a label item
         * @member {String} text_=null
         */
        text_: null
    }}

    /**
     * Triggered after the componentId config got changed
     * @param {String} value
     * @param {String} oldValue
     * @protected
     */
    afterSetComponentId(value, oldValue) {
        if (oldValue) {
            // todo: remove the component domListeners
        }

        if (value) {
            let me           = this,
                component    = Neo.getComponent(value),
                domListeners = component.domListeners || [];

            domListeners.push({
                mouseenter: me.showDelayed,
                delegate  : me.delegate,
                scope     : me
            }, {
                mouseleave: me.hideDelayed,
                delegate  : me.delegate,
                scope     : me
            });

            component.domListeners = domListeners;
        }
    }

    /**
     * Triggered after the stayOnHover config got changed
     * @param {Boolean} value
     * @param {Boolean} oldValue
     * @protected
     */
    afterSetStayOnHover(value, oldValue) {
        if (oldValue) {
            // todo: remove the component domListeners
        }

        if (value) {
            let me           = this,
                domListeners = me.domListeners || [];

            domListeners.push(
                {mouseenter: me.onMouseEnter, scope: me},
                {mouseleave: me.onMouseLeave, scope: me}
            );

            me.domListeners = domListeners;
        }
    }

    /**
     * Triggered after the text config got changed
     * @param {Boolean} value
     * @param {Boolean} oldValue
     * @protected
     */
    afterSetText(value) {
        if (value) {
            let me    = this,
                items = me.items || [],
                item  = items[0];

            if (item && item.ntype === 'label') {
                item.text = value;
            } else {
                items.push({
                    module: Label,
                    text  : value
                });

                me.items = items;
            }
        }
    }

    /**
     * Clears one or multiple setTimeout call(s)
     * @param {String[]|String} timers valid values: dismiss, hide, show
     */
    clearTimeout(timers) {
        if (!Array.isArray(timers)) {
            timers = [timers];
        }

        let me = this,
            id;

        timers.forEach(timer => {
            id = timer + 'DelayTaskId';

            if (me[id]) {
                clearTimeout(me[id]);
                me[id] = null;
            }
        });
    }

    /**
     * Instantly hides the tooltip
     * @param {Object|null} data
     */
    hide(data) {
        let me = this;

        me.clearTimeout(['dismiss', 'hide', 'show']);

        if (me.mounted) {
            me.unmount();
        }
    }

    /**
     * Hides the tooltip using the given hideDelay
     * @param {Object|null} data
     */
    hideDelayed(data) {
        let me = this;

        if (me.hideDelay) {
            me.hideDelayTaskId = setTimeout(me.hide.bind(me), me.hideDelay, data);
        } else {
            me.hide(data);
        }
    }

    /**
     * mouseenter event listener for the tooltip element
     * @param {Object} data
     */
    onMouseEnter(data) {
        let me       = this,
            targetId = data.path[0].id;

        // only use path[0] based events to ignore mouseenter & leave for child nodes
        if (me.id === targetId) {
            me.clearTimeout(['dismiss', 'hide']);
        }
    }

    /**
     * mouseleave event listener for the tooltip element
     * @param {Object} data
     */
    onMouseLeave(data) {
        let me       = this,
            targetId = data.path[0].id;

        // only use path[0] based events to ignore mouseenter & leave for child nodes
        if (me.id === targetId) {
            me.hideDelayed(null);
        }
    }

    /**
     * Instantly shows the tooltip
     * @param {Object} data
     */
    show(data) {
        let me = this;

        me.showDelayTaskId = null;

        me.clearTimeout('hide');

        if (me.dismissDelay) {
            me.dismissDelayTaskId = setTimeout(me.hide.bind(me), me.dismissDelay, data);
        }

        if (!me.mounted) {
            me.mount();
        }
    }

    /**
     * Shows the tooltip using the given showDelay
     * @param {Object} data
     */
    showDelayed(data) {
        let me = this;

        if (me.showDelay) {
            me.showDelayTaskId = setTimeout(me.show.bind(me), me.showDelay, data);
        } else {
            me.show(data);
        }
    }
}

Neo.applyClassConfig(Base);

export {Base as default};