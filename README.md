Content Hub
======

A Javascript Plugin for dynamic content via the [Content Hub](https://contenthub.cloud) platform without dependencies.

## How it Looks Like

Example on the [foosball tracking app](https://kicktrack.app) KickTrack:

![](https://github.com/ddsky/contenthub/blob/master/img/content-hub-example-1.jpg?raw=true "content hub on KickTrack")

## Installation

Download the contenthub.min.js and contenthub.min.css or simply install via bower writing `bower install contenthub` or via npm writing `npm install contenthub`.

## Configuration and Usage

For suggestions to work you have two parts. First, the unibox.min.js and unibox.min.css need to be included and configured on the page. Second, the server needs to give search suggest data for the plugin to show.

```html
<!-- Optional: Get the default stylesheet. -->
<link href="https://contenthub.cloud/cdn/contenthub.min.css" rel="stylesheet">

<!-- Create a section where you want your document stream to appear with id='ch-docs'. -->
<div id="ch-docs" style="width:600px">
    <!-- Create a template of how one entry should look. #key# will be replaced by the value of the field in the document with the key. -->
    <div class="ch-document">
        <h4>#title#</h4>
        <p>#description#</p>
        <div class="ch-document__date">#publishdate#</div>
    </div>
</div>

<!-- Load the module. -->
<script src="https://contenthub.cloud/cdn/contenthub.min.js" type="module"></script> 

<!-- Configure and initialize the module. -->
<script type="module">
    import ContentHub from 'https://contenthub.cloud/cdn/contenthub.min.js';
    var chConfig = {
        apiKey: 'YOUR-PUBLIC-CONTENT-HUB-API-KEY',
        // optional: dateOptions for any fields that are dates and should be formatted
        dateOptions: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        projectId: 'YOUR-CONTENT-HUB-PROJECT-ID',
        stream: {
            // the id of the document stream container
            rootId: 'ch-docs',
            // the number of documents to load initially
            number: 3
        }            
    }
    // initialize on current page
    ContentHub.init(chConfig);
</script> 
```