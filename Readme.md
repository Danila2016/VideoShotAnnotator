# Video Shot Annotator

<br>

## UNDER CONSTRUCTION!

<br>

**VideoShotAnnotator** is a web-based tool for annotating shots and scenes in movies and amateur videos.
It allows to annotate a number of temporal parts of a movie: scene boundaries,
single-shot and multi-shot events.

**VideoShotAnnotator** allows to quickly navigate and explore
feature-length videos with the precision of 1/5 sec.

**VideoShotAnnotator** is written in Javascript and relies on the [CHAP Links library](http://almende.github.io/chap-links-library/),
which further relies on a Javascript API. So, the tool requires an internet connection.

**VideoShotAnnotator** works in Firefox and Chrome browsers.

**VideoShotAnnotator** is an experiemental tool written along with the research on high-level event recognition in videos.

## Introduction

The **VideoShotAnnotator** takes as input a video and its temporal partitioning.
Each temporal segment - **shot** - can be annotated with one of the predefined categories.

A **shot** is a part of video where the camera is continuously recording.
Shot boundaries either correspond to filming stops or can be introduced by the movie director.
In a typical movie a shot usually lasts 5 seconds on average, but sometimes goes down to 1 second
and up to 1 minute. A typical feature-length movie contains around 1000 shots.
The interface is currently tuned for annotation of long videos with the duration of around 1.5 hours.

Alternatively, it is possible to specify any temporal partitioning of the video, including regular
temporal chunks of N seconds. Nevertheless, the temporal segments will be further referred as shots.

## Annotation tutorial

This tutorial will introduce you to the web interface of the **VideoShotAnnotator**.

To begin, open this link in a new tab: [short video](http://Danila2016.github.io/VideoShotAnnotator/interface.htm?user=default&video=forge&zoom=subshot).
Make sure, that you use one of the supported browsers (see above).
If the page does not fit your screen, use zoom-in/zoom-out browser functionality (often located in the View menu tab).

Assume one wants to annotate a video with two forging hammers (see link above). Assume also that there are 3 events of interest:

* ***hit*** - when a hammer hits the forging table
* ***raise-left*** - when the left hammer is raised
* ***raise-right*** - when the right hammer is raised

The easiest shot annotation mode is called **Single shot annotation**.
In this mode, the annotation is performed for 1 shot and 1 category at a time.
Make sure, that the **Single shot annotation** checkbox is ticked.

Press **"Play"** on the video.
When you see a moment when a ***hit*** occurs, press the **"hit"** button on the screen.
You will see the new ***hit*** label on the timeline.
Note that multiple category labels can be assigned to a single shot.

To remove the shot label, press **"Del"** on the keyboard or the small red cross icon (in the bottom).

It is often convenient to pause the video and go back in the movie.
To go back 5 frames, use the **"Left arrow"** on the keyboard.
It is also handy to drag the timeline to the right and navigate precisely.
Beware of a short delay when navigating this way.

## Multiple shot annotation

In order to annotate multi-shot events, you need to untick the **Single shot annotation** checkbox.
Now, when a category is selected, e.g. when you press the ***raise-left*** button,
the shot label does not appear on the timeline.
To start the event, press **"1"** on the keyboard. You will see ***raise-left*** appearing on the timeline.
Now, navigate to the last shot of the event and press **"Enter"**.
This will mark each shot from the first to the last as the ***raise-left*** shot.
Note, that if you forget to press **"Enter"**, the first shot loses the ***raise-left*** label
(convenient, when you make a mistake in the first shot position).

To remove the whole event, press the large red cross icon (in the bottom).

## Special tag for difficult occurences

Each event can be marked as "hard". This label is normally used for the
shots, that have an ambiguous category label or semantically hard to detect.
For example, for the **hit** category, if it is not clear whether a hit has occured
then this is a "difficult-to-recognise" occurence.

To mark the event as "hard", press the **"Toggle hard"** button or the **"H"** key on the keyboard. 
Press **"Toggle hard"** again to remove the "hard" label.


In the end the annotation will look [like this](http://Danila2016.github.io/VideoShotAnnotator/interface.htm?user=final&video=forge&zoom=subshot).

## Navigation

There are numerous ways to navigate the movie.

* Firstly, you can use the mouse and the video controls in the bottom of the video.
* Secondly, you can use Space to Play/Pause the video.
* Thirdly, you can drag the timeline left and right.
* Fourthly, you can go to Previous or Next shot ( **"A"**/**"D"** keys).
* Fifthly, you can navigate to Previous or Next occurrence of the selected category.

The video can be played **"Faster"** (2x speed) or **"Very Fast"** (4x).

## Scene annotation

Divide the video into scenes with the **"Begin scene"** button.
Remove the scene change point with the **"red cross icon"** near the button.
Note, that scene changes are always aligned with the shots.

## Loading a movie

**VideoShotAnnotator** takes as an input a video together with a set of metadata:

* total number of frames
* list of shot boundaries
* video frame rate (fps).

In practice the total number of frames is defined by the end of the last shot.

Note, that for some annotation tasks one can divide the video into regular temporal
chunks, instead of shots.

A movie has to be encoded with x264 codec and in .mp4 format.

## Adaptation to your own task

1. Modify the list of categories in js/interface.js
2. Prepare the empty annotations (see annotation/default for an example and the annotation format below)
3. Convert the videos into the correct format (see above)

## Saving the annotation

The annotation is automatically saved inside the browser every 30 sec.
It relies on the persistent Local Storage of the browser.
So, last saved annotation will be loaded even after the browser is closed.

If you work with a server, make sure to reload the annotation from the server
if you change the browser or the computer.
This is done through the **"Revert to server version"** button.
Otherwise, last version saved in the local storage will be displayed.

## Limitations

Currently, the server functionality is not available. 
To take away the annotation from the browser, you need to implement it yourself. 

## Annotation format

Annotations are located at annotation/&lt;user&gt;/&lt;video&gt;.json

Annotations are stored in JSON format as an associative array.
Let n be the number of shots, m - number of scenes.
String[n] means an array of n strings.
The fields of the array are the following:
```javascript
annotation = {
    // Starting frames of the shots (counting from 0)
    "segm_begins": Integer[n], 

    // Last frames of the shots + 1 (coincide with the start of the next shot)
    "segm_ends": Integer[n],   

    // Not used at the moment; but normally contain importance of the shot;
    // NOTE: JSON clips 1.000 to 1; so, in python it becomes int.
    "importance": Number[n],   

    // Shot classes separated by a single space
    // A "difficult" example has a "-?" appended in the end. E.g. "class1-? class2 class3"
    "shot_tags": String[n],

    // Comment of the shot.
    "shot_comments": String[n],

    // Ending frames of scenes (in the same manner as for shots).
    "scene_ends":[segm['ends'][-1]],
    
    // Video framerate in the format "prop:fps=%0.3f";
    // can also contain tags and properties separated by a single space;
    // properties start with 'prop:<name>='
    "video_tags": String,

    // And some other deprectated fields:
    "scene_comments": String[n],
    "scene_tags":"",
    "scene_types":[""],
    "scene_characters":[""]
}
```

## License

**VideoShotAnnotator** is distributed under CeCILL free software license.

## Citation
If you use the **VideoShotAnnotator**, please cite the following paper:

*Inferring the structure of action movies.* D.Potapov, M.Douze, J.Revaud, Z.Harchaoui, C.Schmid. Wiced workshop, 2017


