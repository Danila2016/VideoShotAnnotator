/* Main file that controls the VideoShotAnnotator interface.
 * 
 * Standard usage:
 *  interface.htm?user=default&video=video1
 *
 * URL arguments:
 *  user - name of the annotator
 *  video - name of the video
 *  
 * Optional:
 *  viddir - url to the video directory
 *  start=hh:mm:ss - where to start the video playback
 *  category - select this category
 *  zoom - set zoom level (e.g. zoom=scene)
 *  cachevideo=1 - enable caching of the video file.
 *      Note: with caching "on", the video may freeze in Chrome when opened in 2 or more tabs
 */

// Save after each key (otherwise - every 30 sec.)
var AUTOSAVE = false;

// List of classes to annotate
var CATEGORIES = ['hit', 'raise-left', 'raise-right'];

// Update current position with the same annotation
function updatePosition(iFrame, what)
{
    if (!iFrame || iFrame < 0)
    {
        iFrame = 0;
    }
    else if (iFrame >= A.getDuration())
    {
        V.video.pause();
        iFrame = A.getDuration() - 1;
    }
    //console.log(iFrame);
    V.update(iFrame, what);
    var iShot = A.getShot(iFrame);
    var iScene = A.getScene(iFrame);
    
    if (T)
    {
        T.update(iFrame);
    }
    
    P.update(iShot, iScene);
}

// Redraw annotation
function updateAnnotation()
{
    var selectedCategory;
    if (P.state != -1)
    {
       selectedCategory = P.categories[P.state];
    }
    T.changeAnnotation(A, selectedCategory);
    updatePosition(V.iFrame);
}

// Parse url arguments
function parseArgs()
{
    var args = document.location.search.substring(1).split('&');
    argsParsed = {};
    for (i=0; i < args.length; i++)
    {
        arg = decodeURI(args[i]);
        if (arg.indexOf('=') == -1)
        {
            argsParsed[arg.trim()] = true;
        }
        else
        {
            kvp = arg.split('=');
            argsParsed[kvp[0].trim()] = kvp[1].trim();
        }
    }
    return argsParsed;
}

// Leave focus from the event object (e.g. button)
function blur(event)
{
    if (!event)
    {
        return;
    }
    var target = (event.target || event.srcElement);
    target.blur();
}

// Validate the annotation
function validate_annotation(ann)
{
    ann.validate();
    
    // Check shot importance
    var m = CATEGORIES.length;
    var si = ann['shot_importance'];
    var st = ann['shot_tags'];
    if (si == undefined)
    {
        ann['shot_importance'] = [];
        si = ann['shot_importance'];
        for (var i = 0; i < st.length; i++)
        {
            si.push([]);
            for (var j = 0; j < m; j++)
            {
                if (st[i].indexOf(CATEGORIES[j]) == -1)
                {
                    si[i].push(0);
                }
                else
                {
                    si[i].push(1);
                }
            }
        }
    }
    else
    {
        if (si.length != st.length)
        {
            alert("Error in annotation (lengths differ)");
            return;
        }
        for (var i = 0; i < si.length; i++)
        {
            if (si[i].length != m) 
            {
                alert("Error in annotation (importance dimension)");
                return;
            }
            for (var j = 0; j < m; j++)
            {
                var k = st[i].indexOf(CATEGORIES[j]);
                if (k == -1 && si[i][j] != 0)
                {
                    alert("Error in annotation (importance without class)");
                }
                else if (k != -1 && si[i][j] == 0)
                {
                    alert("Error in annotation (class without importance)");
                }
            }
            if (-1 in si[i])
            {
                SoftAlert.show("Error: -1 in importance");
            }
        }
    }
}

// Save to the local storage
function save_annotation(ann)
{
    ann.save("vsa_v1_");
}

// Save to the server
function save_infos(event)
{
    validate_annotation(A);

    var http = new XMLHttpRequest();
    var url = "annotation?user=" + USER + "&video=" + VIDEO;
    try
    {
        http.open("POST", url, false);
        http.send(JSON.stringify(A));
        save_annotation(A);
    }
    catch (exc)
    {
    }
    
    if (http.status == 200)
    {
        SoftAlert.show("Saved");
    }
    else
    {
        SoftAlert.show("Saving failed, please try again. " +
            "Server response: " + http.status, 5000, 'error');
    }
    blur(event);
}

// Show the annotation file
function save_to_textbox(event)
{
    save_annotation(A);
    var e = document.getElementById('save_textbox');
    e.innerHTML = JSON.stringify(A);
    SoftAlert.show("Saved data in the bottom of the page");
    blur(event)
}

// Reload the annotation from the server
function revert_infos(event)
{
    A_new = load_infos(true);
    if (!A_new)
    {
        SoftAlert.show("Revert failed. Please try again.", 5000, 'error');
    }
    else
    {
        SoftAlert.show("Reverted");
        A = A_new;
        P.annotation = A_new;
        updateAnnotation();
    }
    blur(event);
}

// Show help
function help(event)
{
    var e = document.getElementById('help');
    var v = e.style.display;
    if (v == 'none')
    {
        v = 'block';
    }
    else
    {
        v = 'none';
    }
    e.style.display = v;
    blur(event);
}

// Display the permanent link to the current position
function showPermanentLink(event)
{
    var t = V.iFrame / A.getFps();
    var timestamp = Math.floor(t/3600).toString() + ":" +
        Math.floor((t%3600)/60).toString() + ":" + 
        Math.floor(t%60).toString();
    var url = window.location.href.split('?')[0];
    var url_parts = url.split('/');
    url = url_parts[url_parts.length-1];
    url += "?video=" + VIDEO + "&user=" + USER + 
        "&start=" + timestamp;
    if (P.state != -1)
    {
        url += "&category=" + P.categories[P.state];
    }
    //url += "&zoom=scene";
    console.log(url);
    //window.location.href = url;    
    var e = document.getElementById('perm_link');
    e.innerHTML = url;
}

// Load text file from server
function loadText(url)
{
    //var http = new XMLHttpRequest();
    var http = new XMLHttpRequest();
    http.open("GET", url, false);
    http.send();
    
    if (http.status !=0 && http.status != 200)
    {
        //console.log(http);
        document.write("Error loading data. Response:" + http.status);
        return;
    }
    
    var text = http.responseText;
    return text;
}

// Load information about the annotated categories (i.e. the annotation)
function load_infos(from_server)
{
    var json_str = undefined;
    try
    {
        if (!from_server)
        {
            json_str = window.localStorage.getItem(
                'vsa_v1_' + USER + '_' + VIDEO);
            if (json_str == null)
            {
                throw "No local storage"
            }
        }
        else
        {
            throw "Load from server"
        }
    }
    catch (e)
    {
        var url = 'annotation/' + USER + '/' + VIDEO + '.json';
        json_str = loadText(url);
    }
    finally
    {
        if (!json_str)
        {
            return;
        }
        
        var ann = JSON.parse(json_str);

        ann = new Annotation(ann);
        validate_annotation(ann);
        
        //save every 30 sec
        window.setInterval(function()
        {
            save_annotation(window.A);
        }, 30000);
        return ann;
    }
}

// Enable keyboard shortcuts
function enableKeys()
{
    V.enableKeys();
    var body = document.getElementsByTagName("body")[0];   
    body.addEventListener("keydown", onkey, false);
}

// Disable keyboard shortcuts
function disableKeys()
{
    V.disableKeys();
    var body = document.getElementsByTagName("body")[0];   
    body.removeEventListener("keydown", onkey, false);
}


// Get the css class name for the given shot and selected category
function getShotCssClass(annotation, iShot, selectedCategory)
{
    if (selectedCategory != undefined)
    {
        var st = annotation['shot_tags'][iShot];
        if (st.indexOf(selectedCategory + "?") != -1)
        {
            return "selected_category_hard";
        }
        else if (st.indexOf(selectedCategory) != -1)
        {
            return "selected_category";
        }
    }
    return undefined;
}

// Get the caption for the given shot
function getShotCaption(annotation, iShot)
{
    var st = annotation['shot_tags'][iShot].split(' ');
    if (st.length == 1 && st[0] == "")
    {
        st = [];
    }
    var si = annotation['shot_importance'][iShot];
    text = "";
    for (var i = 0; i < st.length; i++)
    {
        if (i != 0)
        {
            text += "<br/>";
        }
        var c = st[i].replace('?', '').replace('-B', '');
        var j = CATEGORIES.indexOf(c);
        var color = 'black';
        if (j != -1)
        {
            var imp = si[j];
            if (imp == 1)
            {
                color = 'black';
            }
            else if (imp == 2)
            {
                color = 'red';
            }
            else
            {
                alert("Error in annotation");
            }
        }
        var e = document.createElement('span');
        e.style.color = color;
        var newName = c;
        var hard = (st[i].indexOf('?') != -1);
        if (hard)
        {
            newName = '?-' + newName;
        }
        var B_event = (st[i].indexOf('-B') != -1);
        if (B_event)
        {
            newName = newName + '-B';
        }
        e.innerHTML = newName;
        text += e.outerHTML;
    }
    return text;
}


// Called when the window is loaded
function main()
{
    var args = parseArgs();
    if (args['video'] == undefined)
    {
        args['video'] = 'video1';
    }
    
    if (args['user'] == undefined)
    {
        args['user'] = 'default';
    }
    
    USER = args['user'];
    VIDEO = args['video'];

    if (args['viddir'] == undefined)
    {
        args['viddir'] = 
            "videos/";
    }
    if (args['start'] == undefined)
    {
        args['start'] = "0:0:0";
    }
    if (args['category'] == undefined)
    {
        args['category'] = undefined;
    }
    if (args['zoom'] == undefined)
    {
        args['zoom'] = 'shot';
    }

    // Load from server by default.
    // Use false here to load from local storage.
    A = load_infos(false);
    if (!A)
    {
        return;
    }

    // Parse starting time
    var timestamp = args['start'].split(':');
    var startFrame = (3600*parseFloat(timestamp[0]) + 
            60*parseFloat(timestamp[1]) + 
            parseFloat(timestamp[2]))*A.getFps();

    //Minimum scene duaration in frames
    MIN_SCENE = 5*A.getFps()

    var tnode = document.getElementById("timeline");
    var kwargs = {"height": "200px"}
    T = new TimelineWidget(tnode, A, updatePosition, kwargs);
    
    // When timeline ready
    tnode.addEventListener("timelineready", function()
    {
        V = new VideoWidget(document.getElementById("video"),
            args['viddir'] + VIDEO + ".mp4", undefined,
            A, updatePosition, {cachevideo: args['cachevideo'],
            subtitlesrc: "subtitles/" + VIDEO + ".srt"});

        var e = document.getElementById('shot_props');
        P = new PropsWidget(e, CATEGORIES, A, updateAnnotation,
            {'n_columns': 6, 'selectedCategory': args['category']});

        var body = document.getElementsByTagName("body")[0];   
        body.addEventListener("keydown", onkey, false);
        
        // Remove "loading" label
        var e = document.getElementById("loading");
        e.parentNode.removeChild(e);
        
        enableKeys();
        body.addEventListener("keydown", onesc, false);
            
        setSpeed(1);

        updatePosition(startFrame, 'none');
        updatePosition(startFrame, 'timeline');
        updateAnnotation();
        setZoomLevel(args['zoom']); 

        //V.video.play();

    }, false);
    
}

window.onload = main;

// Get frame number of the next thumbnail
function nextThumbPosition(iFrame)
{
    var f = V.framestep;
    return Math.floor((iFrame + f - 1) / f) * f;
}


// Go to previous segment
function prevSegment(event)
{
    var curFrame = V.iFrame;
    if (P.iShot == 0)
    {
        iFrame = 0;
    }
    else if (Math.abs(A.segm_begins[P.iShot] - curFrame) < V.framestep)
    {
        iFrame = A.segm_begins[P.iShot-1];
    }
    else
    {
        iFrame = A.segm_begins[P.iShot];
    }

    iFrame = nextThumbPosition(iFrame);
    updatePosition(iFrame, "video");
    
    if (event) blur(event);
}

// Go to next segment
function nextSegment(event)
{
    var n = A.segm_begins.length;
    if (P.iShot == n-1)
    {
        iFrame = A.segm_ends[n-1] - 1;
    }
    else
    {
        iFrame = A.segm_begins[P.iShot + 1];
    }
    iFrame = nextThumbPosition(iFrame);
        
    updatePosition(iFrame, "video");
    
    if (event) blur(event);
}

function _contains(st, curShot, curClass)
{
    return st[curShot].indexOf(curClass) != -1;
}

function _is_hard(st, curShot, curClass)
{
    console.log("WARN: check");
    return st[curShot].indexOf(curClass + '?') != -1;
}

// Go to previous occurence of the category
function prevOccurence(event)
{
    if (P.state == -1)
    {
        blur(event);
        return;
    }
    var n = A.segm_begins.length;
    var st = A.shot_tags;
    var curShot = P.iShot - 1;
    if (curShot < 0)
    {
        curShot = 0;
    }
    var curClass = P.categories[P.state];
    // Go to prev shot of this class
    while(curShot > 0)
    {
         if (_contains(st, curShot, curClass) &&
                 (curShot == 0 || !_contains(st, curShot-1, curClass)))
         {
             break;
         }
         curShot--;
    }
    
    iFrame = A.segm_begins[curShot];
    iFrame = nextThumbPosition(iFrame);
    updatePosition(iFrame, "video");
    
    if (event) blur(event);
}

// Go to next occurence of the category
function nextOccurence(event)
{
    var n = A.segm_begins.length;
    if (P.state == -1)
    {
        blur(event);
        return;
    }
    var st = A.shot_tags;
    var curShot = P.iShot + 1;
    if (curShot == n)
    {
        curShot = n - 1;
    }
    var curClass = P.categories[P.state];

    // Go to next shot of this class
    while(curShot < n - 1)
    {
        if (_contains(st, curShot, curClass) &&
                (curShot == 0 || !_contains(st, curShot-1, curClass)))
        {
            break;
        }
        curShot++;
    }
    iFrame = A.segm_begins[curShot];
    iFrame = nextThumbPosition(iFrame);
    updatePosition(iFrame, "video");
    
    if (event) blur(event);
}

function insertSceneChange(event)
{
    var iFrame = Math.round(V.iFrame);
    // insert in the beginning of the current shot
    var iShot = A.getShot(iFrame);
    iFrame = A.segm_begins[iShot];
    var n = A.scene_ends.length;
    if (iFrame < MIN_SCENE || iFrame > A.scene_ends[n-1] - MIN_SCENE)
    {
        SoftAlert.show("A scene cannot be smaller than 5 seconds.");
        blur(event);
        return;
    }
    var j = undefined;
    for (var i = 0; i < n; i++)
    {
        var se = A.scene_ends[i];
        if (Math.abs(iFrame - se) < MIN_SCENE)
        {
            // Unable to set scene change: too close
            SoftAlert.show("A scene cannot be smaller than 5 seconds.");
            blur(event);
            return;
        }
        else if (j == undefined && iFrame < se)
        {
            j = i;
            // Continue to check that the next change is not close
        }
    }
    A.scene_ends.splice(j, 0, iFrame);
    A.scene_types.splice(j+1, 0, "");
    A.scene_characters.splice(j+1, 0, "");
    A.scene_comments.splice(j+1, 0, "");
    A.scene_tags.splice(j+1, 0, "");
    updateAnnotation();
    blur(event);
}

function removeSceneChange(event)
{
    var iFrame = Math.round(V.iFrame);
    // remove in the beginning of the current shot
    var iShot = A.getShot(iFrame);
    iFrame = A.segm_begins[iShot];
    var n = A.scene_ends.length;
    if (iFrame <= 0 || iFrame >= A.scene_ends[n-1])
    {
        blur(event);
        return;
    }
    
    var eps = A.getFps();
    for (var i=0; i < n-1; i++)
    {
        var se = A.scene_ends[i];
        if (Math.abs(iFrame - se) < eps)
        {
            A.scene_ends.splice(i, 1);
            // Keep the annotation for the first scene
            A.scene_types.splice(i+1, 1);
            A.scene_characters.splice(i+1, 1);
            A.scene_comments.splice(i+1, 1);
            A.scene_tags.splice(i+1, 1);
            updateAnnotation();
            blur(event);
            return;
        }
    }
    // No scenes changes close to the time
    blur(event);
}

function gotoBegin()
{
    var iFrame = 0;
    updatePosition(iFrame, "video");
}

function gotoEnd()
{
    var iFrame = A.segm_ends[A.segm_ends.length-1];
    updatePosition(iFrame, "video");
}

function onesc(event)
{
    switch (event.keyCode)
    {
        case 27: //escape
            document.getElementById('scene_comment').blur();
            break;
    }
}


// Keyboard key pressed handler
function onkey(event)
{
    var c = String.fromCharCode(event.keyCode);
    switch (c)
    {
        case '1':
            P.startSegment(1);
            break;

        case '2':
            P.startSegment(2);
            break;

        case 'A':
            prevSegment();
            break;

        case 'D':        
            nextSegment();
            break;
        
        case 'Q':
            gotoBegin();
            break;
        
        case 'E':
            gotoEnd();
            break;
        
        case 'B':
            P.toggleB();
            break;

        case 'H':
            P.toggleHard();
            break;

        case 'O':
            prevOccurence();
            break;

        case 'P':
            nextOccurence();
            break;

    }

    switch (event.keyCode)
    {
        //case 45: //insert
        //    insert_change(V.iFrame);
        //    break;
        case 46: //delete
            P.clearCurrentShot();
            break;
        case 36: //home
            gotoBegin();
            break;
        case 35: //end
            gotoEnd();
            break;
        case 13: //enter
            P.finishSegment();
            break;
        case 187: // +=   FIXME Firefox: both 61
        case 107: // +
            var x = V.video.playbackRate;
            if (x < 2.0001)
            {
                setSpeed(Math.round(x * 2));
            }
            break;
        case 189: // -_   FIXME Firefox: both 173
        case 109: // -
            var x = V.video.playbackRate;
            if (x > 1.9999)
            {
                setSpeed(Math.round(x / 2));
            }
            break;
        default:
            //console.log(event.keyCode);
            break;
    }
    

    // Save after each key pressed (may be slow)
    if (AUTOSAVE)
    {
        save_infos();
    }
}

// Change the playback speed
function setSpeed(x)
{
    V.video.playbackRate = x;
    function changeColor(y)
    {
        var b = document.getElementById("x" + y.toFixed(0));
        if (y.toFixed(0) == x.toFixed(0))
        {
            c = "black"; //"#FFAAAA";
        }
        else
        {
            c = "white";
        }
        b.style.borderColor = c;
        b.blur();
    }
    changeColor(1);
    changeColor(2);
    changeColor(4);
    
}

// Navigate to the given shot
function gotoShot(iShot)
{
    var iFrame = nextThumbPosition(A.segm_begins[iShot]);
    updatePosition(iFrame);
}

function editShotComment(event)
{
    var iShot = P.iShot;
    var x = prompt("Add shot comment", A.shot_comments[iShot]);
    if (x != undefined)
    {
        A.shot_comments[iShot] = x.trim();
    }
    updateAnnotation();
    blur(event);
}

function editVideoComment(event)
{
    var x = prompt("Add video comment", A.video_comment || "");
    if (x != undefined)
    {
        A.video_comment = x.trim();
    }
    updateAnnotation();
    blur(event);
}

function editSceneComment(event)
{
    var iScene = P.iScene;
    var x = prompt("Add scene comment", A.scene_comments[iScene]);
    if (x != undefined)
    {
        A.scene_comments[iScene] = x.trim();
    }
    updateAnnotation();
    blur(event);
}

function setZoomLevel(level, event)
{
    if (level == 'subshot')
    {
        T.shownDuration = 10;
    }
    else if (level == 'shot')
    {
        T.shownDuration = 60;
    }
    else if (level == 'scene')
    {
        T.shownDuration = 600;
    }
    else if (level == 'video')
    {
        T.shownDuration = 6000;
    }
    updateAnnotation();
        
    if (event)
    {
        blur(event);
    }
}

// Specify the current scene as multilocation
function setMultilocation(event)
{
    var elem = document.getElementById("multilocation");
    P.setMultilocation(elem.checked);
    blur(event);
}
