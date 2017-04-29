/*
Widget to display video with fast navigation.
node            - div element to use
vidpath         - path (url) to the video
thumbpath       - (deprecated) a way to speed up video navigation with thumbnails
annotation      - object with properties getFps() and getDuration()
updateCallback  - called when the current time is updated
*/

VideoWidget = function(node, vidpath, thumbpath, annotation, updateCallback,
    kwargs)
{
    var me = this;
    this.annotation = annotation;
    this.updateCallback = updateCallback;
    if (thumbpath)
    {
        SoftAlert.show("Thumbpath deprecated");
    }
    
    this.kwargs = kwargs || {};

    // create video
    var video = document.createElement("video");
    node.appendChild(video);
    video.innerHTML = "Your user agent does not support the HTML5 Video element.";
    video.height = "480";
    video.controls = true;

    function addSource(vidpath, type)
    {
        var source = document.createElement("source");
        video.appendChild(source);
        if (me.kwargs['cachevideo'])
        {
            var args = "";
        }
        else
        {
            // add random flag to overcome Chrome's bug for opening
            // the same video in several tabs
            var args = "?random=" + String(new Date().getMilliseconds());
        }
        source.setAttribute("src", vidpath + args);
        source.type = type;
    }
    addSource(vidpath, 'video/mp4');
   
    video.addEventListener('timeupdate', function(e)
    {
        me.updateCallback(Math.round(me.video.currentTime*me.fps), "none");
    }, false);
    this.video = video;
       
    var body = document.getElementsByTagName("body")[0];
    // keypressed event    
    body.addEventListener("keydown", function(e){me.onkey(e)}, false); 
          
    this.framestep = 5;
    this.fps = this.annotation.getFps();
    this.duration = this.annotation.getDuration();
    this.iFrame = 0;
    
    this.enableKeys();
}

VideoWidget.prototype.enableKeys = function()
{
    this.keys = true;
}

VideoWidget.prototype.disableKeys = function()
{
    this.keys = false;
}

// what can be:
// 'video' - update video currentTime
// 'none'  - just save current state
VideoWidget.prototype.update = function(iFrame, what)
{
    if (iFrame < 0 || iFrame >= this.duration)
    {
        return;
    }

    this.iFrame = iFrame;
    
    if (what == "timeline")
    {
        var i = Math.round(iFrame / this.framestep);
        this.video.currentTime = iFrame / this.fps;
    }
    else if (what == "video")
    {
        this.video.currentTime = iFrame / this.fps;
    }
}


VideoWidget.prototype.onkey = function(e)
{
    if (!this.keys) return;

    switch (String.fromCharCode(e.keyCode))
    {
        case ' ': // play/pause video
            if (this.video.paused)
            {
                this.video.play();
            }
            else
            {
                this.video.pause();
            }
            
            blur(e);
            links.Timeline.preventDefault(e);
            break;
            
    }
    
    switch (e.keyCode)
    {
        case 37: //left
            if (this.video.paused)
                this.updateCallback(
                Math.round(this.iFrame/this.framestep - 1) * this.framestep,
                    "video");
            break;
        case 39: //right
            if (this.video.paused)
                this.updateCallback(
                Math.round(this.iFrame/this.framestep + 1) * this.framestep,
                    "video");
            break;
    }
}


// Play a video segment starting at frame "begin" and ending at frame "end"
VideoWidget.prototype.playSegment = function(begin, end)
{
    this.video.pause();
    this.update(begin, "video");
    this.video.play();
    var me = this;
    setTimeout(function()
    {
        me.video.pause();
    }, 1000*(end-begin)/me.fps);
}

