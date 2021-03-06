import Base from '../core/Base.mjs';

/**
 * @class Neo.util.Css
 * @extends Neo.core.Base
 */
class Css extends Base {
    static getConfig() {return {
        className: 'Neo.util.Css'
    }}

    static insertRules(rules) {
        let me = this;

        Neo.worker.App.promiseMessage('main', {
            action : 'insertCssRules',
            appName: me.appName,
            rules  : rules
        }).then(function(data) {
            // console.log('inserted CSS rules', data);
        }).catch(function(err) {
            console.log('App: Got error attempting to insert CSS rules', err, rule);
        });
    }
}

Neo.applyClassConfig(Css);

export default Css;