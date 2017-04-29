/* Annotation - class to store the temporal video annotation.
 *   TODO: constructor without arguments
 */
Annotation = function(ann)
{
    for (var x in ann)
    {
        this[x] = ann[x];
    }
    this.__fps = parseFps(this);
};

// Get video fps
Annotation.prototype.getFps = function()
{
    return this.__fps;
};
// Get video duration in frames. Whole video must be covered by segments.
Annotation.prototype.getDuration = function()
{
    // get maximum frame number
    var maxFrame =  Math.max.apply(Math, this.segm_ends);
    //console.log(maxFrame);
    return maxFrame;
};
// Get segment index by frame number
Annotation.prototype.getShot = function(iFrame)
{
    for (var i=0; i<this.segm_ends.length; i++)
    {
        if (this.segm_begins[i] <= iFrame &&
            this.segm_ends[i] > iFrame)
        {
            return i;
        }
    }
    return undefined;
};
// Get scene index by frame number
Annotation.prototype.getScene = function(iFrame)
{
    for (var i=0; i<this.scene_ends.length; i++)
    {
        if ((i == 0 || this.scene_ends[i-1] <= iFrame) &&
            this.scene_ends[i] > iFrame)
        {
            return i;
        }
    }
    return undefined;
};
// Save to browser local storage
Annotation.prototype.save = function(prefix)
{
    if (prefix == undefined)
    {
        prefix = '';
    }
    try
    {
        window.localStorage.setItem(prefix + USER + '_' + VIDEO,
            JSON.stringify(A));
    }
    catch (e)
    {
        alert("Error writing to local storage: " + e.description +
            " Try cleaning cookies.");
    }
};
// Validate annotation
Annotation.prototype.validate = function()
{
    if (this.scene_ends != undefined)
    {
        var n = this.scene_ends.length;
        if  (this.scene_types.length != n ||
            this.scene_characters.length != n ||
            this.scene_comments.length != n ||
            this.scene_tags.length != n
            )
        {
            alert("Error in scene data!");
        }
    }
    else
    {
        SoftAlert.show("Warning: no scene annotation");
        var m = this.segm_ends.length;
        this.scene_ends = [this.segm_ends[m-1]];
        this.scene_types = [""];
        this.scene_characters = [""];
        this.scene_comments = [""];
        this.scene_tags = [""];
    }
    var m = this.segm_ends.length;
    if (this.segm_begins.length != m ||
        this.shot_comments.length != m ||
        this.shot_tags.length != m ||
        this.importance.length != m || 
        this.shot_importance.length != m)
    {
        alert("Error in shot data!");
    }

    for (var i=0; i<m; i++)
    {
        if (i>0)
        {
            var x = this.segm_begins[i];
            var y = this.segm_ends[i-1];
            var z = this.segm_begins[i-1];
            if (x != y || z > x)

            {
                alert("Warning: non-contiguous segmentation!");
                break;
            }
            if (x == z)
            {
                alert("Warning: segment with length 0!");
                break;
            }
        }
    }
};

// Parse Fps from annotation object
function parseFps(info)
{
    var t = info['video_tags'];
    var i = t.indexOf("prop:fps=");
    if (i == -1)
    {
        alert("FPS undefined");
    }
    else
    {
        var fps = parseFloat(t.substr(i+9));
    }
    return fps;
}




