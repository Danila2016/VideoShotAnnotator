/* TimelineWidget  -  Displays a timeline with the video annotation.
 *      Depends on the links.Timeline (timeline.js)
 * Arguments:
 *  node - DOM element (div) where to put the timeline;
 *  annotation - object of class Annotation;
 *  updateCallback - function to call when the timeline is moved;
 *  kwargs - optional arguments [default]:
 *      hideLabels [false]
 *      height [75px]
 *      width [100%]
 *      shownDuration [60]
 */
TimelineWidget = function(node, annotation, updateCallback, kwargs)
{

    this.node = node;
    this.updateCallback = updateCallback;
    this.shownDuration = 60;  // time range (in sec) of the timeline on the screen
    this.kwargs = kwargs || {};
    
    // Timezone offset in milliseconds
    //this.offset = (new Date()).getTimezoneOffset()*60000;

    // Expect for daylight saving time
    function stdTimezoneOffset()
    {
        var year = (new Date()).getFullYear();
        var jan = new Date(year, 0, 1);
        var jul = new Date(year, 6, 1);
        return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    }
    this.offset = stdTimezoneOffset()*60000;

    // Set callback to run when API is loaded
    //google.setOnLoadCallback(function()
    //{});

    google.load('visualization', '1', {'packages':['corechart', 'timeline'],
        'callback':createTimeline});


    this.framestep = 5;

    var me = this;
    function createTimeline()
    {
        //create timeline
        var options = {width:  "100%",
            height: kwargs.height || "75px",
            layout: "box",
            editable: false,
            selectable: false,
            unselectable: false,
            showMajorLabels: false,
            snapEvents: false,
            showCustomTime: true,
            zoomable: false,
             // minimal margin in pixels between events (both x and y!)
            eventMargin: 0,
            width: kwargs.width || "100%"
            //scale: links.Timeline.StepDate.SCALE.MILLISECOND,
            //step: 200
        };
        
        if (kwargs['hideLabels'])
        {
            options.showMinorLabels = false;  
        }
        
        if (kwargs.shownDuration)
        {
            me.shownDuration = kwargs.shownDuration;
        }
        
        // Instantiate our timeline object.
        me.timeline = new links.Timeline(node);

        // Draw the timeline using options
        me.timeline.draw([], options);
        me.changeAnnotation(annotation);
        
        //when navigating
        links.events.addListener(me.timeline, 'rangechange', function(event)
        {
            //var curTime = me.timeline.getCustomTime();
            //var iFrame = curTime.getTime()/1000*me.annotation.getFps();
            var r = me.timeline.getVisibleChartRange();
            var iFrame = 0.5*(me.dateToFrame(r.start) + me.dateToFrame(r.end));
            if (iFrame != me.iFrame)
            {
                me.iFrame = iFrame;
                me.updateCallback(iFrame, "timeline");
            }      
        });

        
        links.events.addListener(me.timeline, 'timechanged', function(event)
        {
            var custom_iFrame = me.dateToFrame(event.time);
            var new_iFrame = custom_iFrame;
            if (new_iFrame != me.iFrame)
            {
                me.iFrame = new_iFrame;
                me.updateCallback(new_iFrame, "timeline");
            }
        });
        
        // Trigger event when ready
        var event = new CustomEvent
        (
            "timelineready",
            {
                detail:
                {
                    state: "ok"
                },
                bubbles: false, // do not propagate events to ancestors,
                cancelable: true // events can be canceled with stopPropagation()
            }
        );
        
        me.node.dispatchEvent(event);
    }

    this.iFrame = -1;
    
};

Array.prototype.max = function()
{
    return Math.max.apply(Math, this);
};

/*
function check_probs(importance)
{
    var probs = false;
    for (var i=0; i<importance.length; i++)
    {
        var x = 3*[importance[i]];
        if (Math.abs(Math.round(x) - x) > 0.0001)
        {
            probs = true;
            break;
        }
    }
    return probs;
}
*/

TimelineWidget.prototype.dateToFrame = function(d)
{
    if (this.fps == undefined)
    {
        throw "Timeline not ready";
    }
    ms = d.getTime() - this.offset;
    return (ms/1000)*this.fps;
}

TimelineWidget.prototype.frameToDate = function(f)
{
    if (this.fps == undefined)
    {
        throw "Timeline not ready";
    }
    ms = (f / this.fps)*1000;
    return new Date(ms + this.offset);
}



TimelineWidget.prototype.changeAnnotation = function(annotation, selectedCategory)
{
    this.annotation = annotation;
    this.fps = annotation.getFps();
    
    var begins = annotation.segm_begins;
    var ends = annotation.segm_ends;
    //var importance = annotation.importance;
    
    var items = [];
    for (var i=0; i<begins.length; i++)
    {
        var d =  (ends[i] - begins[i]) / this.fps;
        
        var eventClass = getShotCssClass(annotation, i, selectedCategory) || 'unlabeledShot';
        var content = getShotCaption(annotation, i);
        if (!content || content == '')
        {
            content = '|';
        }
        
        items.push({
            start: this.frameToDate(begins[i] + 0.5),
            end: this.frameToDate(ends[i] - 0.5),
            content: content,
            className: eventClass,
            group: "shots"});
            //title: annotation.shot_tags[i]});
            //content: annotation.shot_tags[i] + "|"});
    }
    
    if (annotation.scene_ends)
    {
        var scene_changes = annotation.scene_ends.slice(0);
        scene_changes.splice(0,0,0);
        var scene_comments = annotation.scene_comments;
        var scene_types = annotation.scene_types;
        var scene_characters = annotation.scene_characters;
        for (var i=1; i<scene_changes.length; i++)
        {
            var content;
            try
            {
                content = [scene_types[i-1] || "",
                    scene_characters[i-1] || "",
                    scene_comments[i-1] || ""].join('|');
            }
            catch (e)
            {
                content = "";
            }
            items.push({
                start: this.frameToDate(scene_changes[i-1] + 0.5),
                end: this.frameToDate(scene_changes[i] - 0.5),
                content: content,
                className: "unlabeledShot",
                group: "scenes"});
        }    
    }
        
    this.timeline.setData(items);
}

TimelineWidget.prototype.setTitle = function(name)
{
    if (this.title == undefined)
    {
        this.title = document.createElement("span");
        this.title.align = "center";
        this.node.parentNode.insertBefore(this.title, this.node);
    }
    this.title.innerHTML = name;
}

TimelineWidget.prototype.update = function(iFrame, origin)
{
    iFrame = Math.round(iFrame/this.framestep) * this.framestep;
    this.iFrame = iFrame;
    //update timeline
    var tsec = iFrame / this.fps;
    this.timeline.setCustomTime(this.frameToDate(iFrame));
    this.timeline.setVisibleChartRange(
        this.frameToDate(iFrame - 0.5*this.shownDuration*this.fps),
        this.frameToDate(iFrame + 0.5*this.shownDuration*this.fps));
    var iShot = this.annotation.getShot(iFrame);
    this.timeline.selectItem(iShot);
}


