/* PropsWidget - class that creates and manages the category annotation buttons.
 *
 */
PropsWidget = function(node, categories, annotation, updateAnnotationCallback,
    kwargs)
{
    this.categories = categories;
    this.annotation = annotation;
    this.updateAnnotation = updateAnnotationCallback;

    kwargs = kwargs || {};
    var n_columns = kwargs['n_columns'] || 5;
    var selectedCategory = kwargs['selectedCategory'];

    this.iShot = -1;
    this.iScene = -1;
    
    // Current class index or -1 (default)
    this.state = categories.indexOf(selectedCategory);

    // Beginning of the new segment
    this.new_begin = undefined;
    // Importance of the new segment
    this.new_importance = undefined;
    // Class of the new segment
    this.new_class = undefined;
    
    // when True - annotate immediately (otherwise - wait for 1 or 2 keys)
    this.perShotAnnotation = true;

    var me = this;
    var form = document.createElement('form');
    node.appendChild(form);

    // Shot buttons
    this.shot_buttons = [];
    function addOption(index, name)
    {
        var b = document.createElement('button');
        b.type = 'button';
        b.id = name;
        b.innerHTML = name;
        b.className = 'mybutton';
        //b.name = 'state';
        b.addEventListener('click', function(e) {
            var target = e.target || e.srcElement;
            var selectedCategory = target.id;
            me.state = me.categories.indexOf(selectedCategory);
            if (me.perShotAnnotation && me.state != -1)
            {
                me.setClass(target.id, me.iShot, 1.0);
                me.updateAnnotation();
            }
            else
            {
                // Highlight shots of the selected category
                me.updateAnnotation();
            }
            me.update(me.iShot, me.iScene);
            blur(e);
        }, false);
        form.appendChild(b);
        if (n_columns && index % n_columns == n_columns-1)
        {
            form.appendChild(document.createElement('br'));
        }
        me.shot_buttons.push(b);
        return b;
    }
    
    // Create interface
    // create category buttons (+hard), add callbacks
    for (var i = 0; i < categories.length; i++)
    {
        addOption(i, categories[i]);
    }
    addOption(categories.length, "All");

    // "Clear current shot"
    var img = document.createElement('img');
    img.src = "css/img/deleteEvent.png";
    img.title = "Clear event in current shot";
    img.width = 20;
    img.height = 20;
    img.className = 'mycross';
    img.addEventListener('click', function(event){
        me.clearCurrentShot();
    }, false);
    node.appendChild(img);

    // "Remove event" icon
    var img = document.createElement('img');
    img.src = "css/img/deleteEvent.png";
    img.title = "Remove event";
    img.width = 26;
    img.height = 26;
    img.className = 'mycross';
    img.addEventListener('click', function(event){
        me.removeCurrent();
    }, false);
    node.appendChild(img);

    var b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = "Toggle hard";
    b.addEventListener('click', function(event){
        me.toggleHard();
        blur(event);
    }, false);
    node.appendChild(b);
    
    /*var b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = "Toggle B-event";
    b.addEventListener('click', function(event){
        me.toggleB();
        blur(event);
    }, false);
    node.appendChild(b);
    */

    var e = document.createElement('input');
    e.type = 'checkbox';
    e.checked = true;
    e.addEventListener('click', function(event){
        var target = event.target || event.srcElement;
        if (target.checked)
        {
            me.perShotAnnotation = true;
        }
        else
        {
            me.perShotAnnotation = false;
        }
    }, false);
    node.appendChild(e);
    var e = document.createElement('span');
    e.innerHTML = 'Single shot annotation';
    node.appendChild(e);

    node.appendChild(document.createElement('br'));
};


// Start segment of a given importance
PropsWidget.prototype.startSegment = function(importance)
{
    var state = this.state;
    if (state == -1)
    {
        return;
    }
    var new_begin = this.new_begin;
    var new_importance = this.new_importance;
    var iShot = this.iShot;
    var st = this.annotation['shot_tags'][iShot];
    var si = this.annotation['shot_importance'][iShot];
    var curClass = this.categories[state];
    if (new_begin == undefined)
    {
        this.new_begin = iShot;
        this.new_importance = importance;
        this.new_class = this.categories[state];
        this.setClass(curClass, iShot, importance);
        this.updateAnnotation();
    }
    else // repeating 1 or 2 button
    {
        this.clearClass(this.new_class, new_begin);
        this.new_begin = undefined;
        this.new_importance = undefined;
        this.new_class = undefined;
        this.startSegment(importance);
    }
};

// Finish the current segment
PropsWidget.prototype.finishSegment = function()
{
    var curClass = this.new_class;
    if (curClass == undefined)
    {
        return;
    }
    var new_begin = this.new_begin;
    var new_end = this.iShot + 1;
    if (new_begin >= new_end)
    {
        SoftAlert.show("Segment must end after it begins");
        return;
    }
    var new_importance = this.new_importance;
    for (var i = new_begin + 1; i < new_end; i++)
    {
        this.setClass(curClass, i, new_importance);
    }
    this.new_begin = undefined;
    this.new_importance = undefined;
    this.new_class = undefined;
    this.updateAnnotation();
};

// Set the class and importance for a given shot
PropsWidget.prototype.setClass = function(name, iShot, importance)
{
    var st = this.annotation['shot_tags'];
    var classes = st[iShot];
    if (classes == "")
    {
        classes = [];
    }
    else
    {
        classes = classes.split(' ');
    }

    category = name.replace('?', '').replace('-B', '');
    var found = false;
    for (var i = 0; i < classes.length; i++)
    {
        if (classes[i].indexOf(category) != -1)
        {
            found = true;
            classes[i] = name;
            break;
        }
    }
    if (!found)
    {
        // add category
        classes.push(name);
    }
    st[iShot] = classes.join(' ');
    
    // Set importance
    var state = this.categories.indexOf(category);
    this.annotation['shot_importance'][iShot][state] = importance;
};

// Clear the given event in the specified shot
PropsWidget.prototype.clearClass = function(name, iShot)
{
    var st = this.annotation['shot_tags'];
    var categories = st[iShot];
    if (categories == "")
    {
        categories = [];
    }
    else
    {
        categories = categories.split(' ');
    }
    var i = categories.indexOf(name);
    if (i != -1)
    {
        // remove category
        categories.splice(i, 1);        
    }
    st[iShot] = categories.join(' ');
    
    // Clear importance
    var category = name.replace('?', '').replace('-B', '');
    var state = this.categories.indexOf(category);
    this.annotation['shot_importance'][iShot][state] = 0;
};

// Clear event that correspond to state in the current shot only
PropsWidget.prototype.clearCurrentShot = function()
{
    var state = this.state;
    var classes;
    if (state == -1)
    {
        classes = this.categories;
    }
    else
    {
        classes = [this.categories[state]];
    }
    var iShot = this.iShot;
    var st = this.annotation['shot_tags'][iShot];
    for (var i = 0; i < classes.length; i++)
    {
        var category = classes[i];
        var name = this.getName(category, iShot);
        this.clearClass(name, iShot);
    }
    this.updateAnnotation();
};

// Remove events that correspond to current state and contain current shot
PropsWidget.prototype.removeCurrent = function()
{
    var state = this.state;
    var classes;
    if (state == -1)
    {
        classes = this.categories;
    }
    else
    {
        classes = [this.categories[state]];
    }
    var iShot = this.iShot;
    for (var i = 0; i < classes.length; i++)
    {
        this.removeEvent(classes[i], iShot);
    }
    this.updateAnnotation();
};

// Remove the whole event of the given category
PropsWidget.prototype.removeEvent = function(category, iShot)
{
    bounds = this.getBounds(category, iShot);
    if (bounds == undefined)
    {
        return;
    }
    var name = this.getName(category, iShot);
    for (var i = bounds[0]; i < bounds[1]; i++)
    {
        this.clearClass(name, i);
    }
};

// Get segment bounds [begin, end)   or   undefined
// Category is given without '?'
PropsWidget.prototype.getBounds = function(category, iShot)
{
    var st = this.annotation['shot_tags'];
    
    if (st[iShot].indexOf(category) == -1)
    {
        return undefined;
    }

    var name = this.getName(category, iShot);
       
    bounds = [0, st.length];
    for (var i = iShot; i < st.length; i++)
    {
        if (st[i].split(' ').indexOf(name) == -1)
        {
            bounds[1] = i;
            break;
        }
    }
    for (var i = iShot-1; i >= 0; i--)
    {
        if (st[i].split(' ').indexOf(name) == -1)
        {
            bounds[0] = i+1;
            break;
        }
    }
    return bounds;
};

// Redraw the information given the current shot and scene
PropsWidget.prototype.update = function(iShot, iScene)
{
    this.iShot = iShot;
    this.iScene = iScene;
    
    // Display scene description
    var e = document.getElementById('scene_comment');
    e.innerHTML = this.annotation['scene_comments'][iScene]
        .split(";").join("<br>");;

    // Display multilocation checkbox
    var e = document.getElementById('multilocation');
    var tags = this.annotation['scene_tags'][iScene];
    e.checked = (tags.indexOf("prop:multilocation") != -1);

    // Display shot classes
    var curClass;
    var state = this.state;
    if (state == -1)
    {
        curClass = 'All';
    }
    else
    {
        curClass = this.categories[state];
    }
    for (var i = 0; i < this.shot_buttons.length; i++)
    {
        var b = this.shot_buttons[i];
        if (b.id == curClass)
        {
            b.style.borderColor = 'red';
        }
        else
        {
            b.style.borderColor = 'white';
        }
    }

    // Display shot comment
    var e = document.getElementById('shot_comment');
    e.innerHTML = this.annotation['shot_comments'][this.iShot]
        .split(";").join("<br>");

    // Display video comment
    var e = document.getElementById('video_comment');
    e.innerHTML = (this.annotation['video_comment'] || "")
        .split(";").join("<br>");

};

// Toggle hard
PropsWidget.prototype.toggleHard = function()
{
    var state = this.state;
    if (state == -1)
    {
        return;
    }
    if (this.new_class != undefined)
    {
        SoftAlert.show("Segment not finished!");
        return;
    }
    var curClass = this.categories[state];
    bounds = this.getBounds(curClass, this.iShot);
    if (bounds == undefined)
    {
        return;
    }
    var name = this.getName(curClass, this.iShot);
    var newName;
    if (name.indexOf('?') != -1)
    {
        newName = curClass;
    }
    else
    {
        newName = curClass + '?';
    }
    if (name.indexOf('-B') != -1)
    {
        newName = newName + '-B';
    }

    var si = this.annotation['shot_importance'];
    for (var i = bounds[0]; i < bounds[1]; i++)
    {
        this.setClass(newName, i, si[i][state]);
    }
    this.updateAnnotation();
};

// Get the caption of the shot
PropsWidget.prototype.getName = function(category, iShot)
{
    var st = this.annotation['shot_tags'][iShot];
    var name = category;
    if (st.indexOf(name + '?') != -1)
    {
        name = name + '?';
    }
    if (st.indexOf(name + '-B') != -1)
    {
        name = name + '-B';
    }
    return name;
};

// Toggle B-event   TODO: implement with a checkbox
// PropsWidget.prototype.toggleB = function()
// {
//     var state = this.state;
//     if (state == -1)
//     {
//         return;
//     }
//     var curClass = this.categories[state];
//     bounds = this.getBounds(curClass, this.iShot);
//     if (bounds == undefined)
//     {
//         return;
//     }
//     var name = this.getName(curClass, this.iShot);
//     var ib = name.indexOf("-B")
//     if (ib == -1)
//     {
//         name = name + "-B";
//     }
//     else
//     {
//         name = name.slice(0, ib);
//     }
//     var si = this.annotation['shot_importance'];
//     for (var i = bounds[0]; i < bounds[1]; i++)
//     {
//         this.setClass(name, i, si[i][state]);
//     }
//     this.updateAnnotation();
// };

PropsWidget.prototype.setMultilocation = function(state)
{
    var st = this.annotation.scene_tags;
    var t = st[this.iScene];
    var tag = "prop:multilocation";
    if (state == true)
    {
        if (t.indexOf(tag) == -1)
        {
            st[this.iScene] += (" " + tag);
        }
    }
    else
    {
        if (t.indexOf(tag) != -1)
        {
            var x = t.split(' ');
            var y = [];
            for (var i = 0; i < x.length; i++)
            {
                if (x[i] != tag)
                {
                    y.push(x[i]);
                }
            }
            st[this.iScene] = y.join(' ');
        }
    }
};
