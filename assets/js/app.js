// 页面控制逻辑
// 加载类库
const ipcRenderer = require('electron').ipcRenderer
const log = require('electron-log')

let vm = new Vue({
    el: '#app',
    data: {
        db: null,
        filters: ['text/html', 'text/rtf', 'text/plain', 'image'],
        mode_pause: false
    },
    methods: {
        updateDB: function() {
            this.db = ipcRenderer.sendSync('request-data');
        },
        checkFilters: function(type) {
            return this.filters.includes(type) || (type.substr(0, 5) && this.filters.includes(type.substr(0, 5)));
        },
        isShow: function(record) {
            let show = false;

            for (let i = 0; i < record.content.length; i++) {
                show = this.checkFilters(record.content[i].type);
            }
            
            return show;
        },
        clickCopy: function(idx) {
            ipcRenderer.send('request-copy', idx);
            log.debug('request copy item #' + idx);
        },
        clickRemove: function(idx) {
            ipcRenderer.send('request-remove', idx);
            log.debug('request item removeing #' + idx);
        },
        clickSave: function(idx) {
            ipcRenderer.send('request-save', idx);
            log.debug('request save item #' + idx);
        },
        clickRemoveAll: function() {
            ipcRenderer.send('request-removeAll');
            log.debug('request removing all items');
        },
        fullContent: function(idx) {
            ipcRenderer.send('request-fullContent', idx);
            log.debug('request full content');
        },
    },
    watch: {
        mode_pause: function(new_val, old_val) {
            let channel = new_val ? 'request-mode-pause-on' : 'request-mode-pause-off';
            ipcRenderer.send(channel);
            log.debug(channel);
        }
    },
    mounted: function() {
        this.updateDB();

        // listen detailedview-update event
        ipcRenderer.on('detailedview-update', function(event, arg) {
            vm.updateDB();
        });
    }
});