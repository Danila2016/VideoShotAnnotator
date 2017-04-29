/* SoftAlert - singleton for showing soft alerts (i.e. messages)
 *      The alerts are displayed for <delay> milliseconds.
 *      To show an alert always use SoftAlert.show().
 *      The code relies on the Javascript closures in setTimeout block and removeAlert function. 
 */
SoftAlert = {
    show: function(message, delay, status)
    {
        var color = "yellow";
        if (status == 'error')
        {
            color = "red";
        }
        this.body = document.getElementsByTagName("body")[0];
        var div = document.createElement("div");
        div.innerHTML = '<div align="center"' +
            ' style="position:absolute; z-index:9999; font-size:20; ' +
            'left:0; top:0; width:100%; background-color:' + color + '">' +
            message + '</div>';
        this.body.insertBefore(div, this.body.firstChild);
        if (!this.divs) this.divs = [];
        this.divs.push(div);
        var me = this;
        
        function removeAlert(event)
        {   
            if (me.divs.length == 0) return;
            var d = me.divs[0];
            me.divs.splice(0, 1);
            me.body.removeChild(d);
        }

        div.onclick = removeAlert;
        if (delay && delay < 0) return;
        
        window.setTimeout(function ()
        {
            if (me.divs.length == 0) return;
            var d = me.divs[0];
            me.divs.splice(0, 1);
            me.body.removeChild(d);
        }, delay || 2000);
    }
};
