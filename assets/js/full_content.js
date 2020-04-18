const ipcRenderer = require('electron').ipcRenderer
const log = require('electron-log')

let vm = new Vue({
    el: '#app',
    data: {
        contents: null,
    },
    mounted: function () {
        ipcRenderer.on('show-content', function(event, arg) {
            if (arg) {
                vm.contents = arg.content;
            }
        });
    }
});