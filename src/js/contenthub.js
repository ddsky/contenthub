const ContentHub = (function ContentHub() {
    let chConfig;

    const CONTENT_HUB_API_BASE = 'https://api.contenthub.cloud/';

    // look for values to replace
    function replaceTemplateValues() {
        let chValueNodes = document.getElementsByClassName('ch-value');
        for (let i = 0; i < chValueNodes.length; i++) {
            const element = chValueNodes[i];
            let elementHtml = element.innerHTML;

            let fieldPlaceHolders = elementHtml.match(/#.*?#/g);
            for (let f = 0; f < fieldPlaceHolders.length; f++) {
                let instructions = fieldPlaceHolders[f].replace(/#/g, '');

                // split, first part is document, second the key of the field
                let iParts = instructions.split('.');

                if (iParts.length < 2) {
                    continue;
                }

                let oReq = new XMLHttpRequest();
                oReq.onreadystatechange = function () {
                    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                        let parsedResponse = (JSON.parse(this.response));
                        console.log(parsedResponse);
                        elementHtml = elementHtml.replace(fieldPlaceHolders[f], parsedResponse[iParts[1]].value);
                        element.innerHTML = elementHtml;
                    }
                };
                oReq.open('GET', CONTENT_HUB_API_BASE + 'projects/' + chConfig.projectId + '/documents/' + iParts[0] + '/field?key=' + encodeURIComponent(iParts[1]) + '&apiKey=' + chConfig.apiKey);
                oReq.send();
            }
        }
    }

    // initialize stream
    function initializeStream() {
        if (!chConfig.stream) {
            return;
        }
        const xhr = new XMLHttpRequest();
        let offset = 0;
        let totalVisible = 0;

        // defaults if not set in chConfig.stream
        let dateOptions = (chConfig.dateOptions || { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        let rootId = chConfig.stream.rootId;
        if (rootId.indexOf('#') === 0) {
            rootId = rootId.substring(1);
        }

        const templateHtml = document.getElementsByClassName('ch-document')[0].outerHTML;

        let rootNode = document.getElementById(rootId);
        rootNode.innerHTML = '';

        const reqDoc = {
            offset,
            number: (chConfig.stream.number || 10),
            filters: (chConfig.stream.filters || [])
        };
        function requestStream() {
            xhr.open('POST', CONTENT_HUB_API_BASE + 'projects/' + chConfig.projectId + '/documents/filter?apiKey=' + chConfig.apiKey, true);

            //Send the proper header information along with the request
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(reqDoc));
        }

        let documentsCallback = (response) => {
            // remove show more button (will be added again)
            let showMoreWrapperNodes = document.getElementsByClassName('ch-show-more-wrapper');
            for (let i = 0; i < showMoreWrapperNodes.length; i++) {
                rootNode.removeChild(showMoreWrapperNodes[i]);
            }

            let backlinkNode = document.getElementById('ch-backlink');
            if (backlinkNode) {
                rootNode.removeChild(backlinkNode);
            }

            console.log(response);
            for (let i = 0; i < response.documents.length; i++) {
                let doc = response.documents[i];
                let filledTemplate = templateHtml;
                filledTemplate = filledTemplate.replace('#title#', doc.title);
                filledTemplate = filledTemplate.replace('#creationdate#', new Date(doc.creationDate).toLocaleDateString(undefined, dateOptions));
                filledTemplate = filledTemplate.replace('#lastmodificationdate#', new Date(doc.lastModificationDate).toLocaleDateString(undefined, dateOptions));
                filledTemplate = filledTemplate.replace('#publishdate#', new Date(doc.publishDate).toLocaleDateString(undefined, dateOptions));

                // replace field mentions
                let fieldPlaceHolders = filledTemplate.match(/#[a-zA-Z]+[a-zA-Z0-9 ]*?#/g);
                for (let f = 0; f < fieldPlaceHolders.length; f++) {
                    let key = fieldPlaceHolders[f].replace(/#/g, '');

                    for (let k = 0; k < doc.fields.length; k++) {
                        let field = doc.fields[k];
                        if (field.key.toLowerCase() === key) {
                            filledTemplate = filledTemplate.replace(fieldPlaceHolders[f], field.value);
                            break;
                        }
                    }

                    // if nothing was found, let's still remove the placeholder
                    // console.log('deleting: ' + fieldPlaceHolders[f]);
                    filledTemplate = filledTemplate.replace(fieldPlaceHolders[f], '');
                }

                filledTemplate = filledTemplate.trim(); // Never return a text node of whitespace as the result

                let temp = document.createElement('template');
                temp.innerHTML = filledTemplate;
                let entry = temp.content.firstChild;

                rootNode.appendChild(entry);
            }

            totalVisible += response.documents.length;

            // show more button?
            let rest = response.matches - totalVisible;
            let showMoreConfig = (chConfig.stream.showMore || { showButton: true, html: '<div class="ch-show-more-wrapper"><div class="ch-show-more"><svg id="ch-show-more-loader" width="30px"  height="30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-ripple" style="background: none;"><circle cx="50" cy="50" r="39.3993" fill="none" ng-attr-stroke="{{config.c1}}" ng-attr-stroke-width="{{config.width}}" stroke="#ffffff" stroke-width="4"><animate attributeName="r" calcMode="spline" values="0;30" keyTimes="0;1" dur="1.7" keySplines="0 0.2 0.8 1" begin="-0.85s" repeatCount="indefinite"></animate><animate attributeName="opacity" calcMode="spline" values="1;0" keyTimes="0;1" dur="1.7" keySplines="0.2 0 0.8 1" begin="-0.85s" repeatCount="indefinite"></animate></circle><circle cx="50" cy="50" r="23.731" fill="none" ng-attr-stroke="{{config.c2}}" ng-attr-stroke-width="{{config.width}}" stroke="#ffffff" stroke-width="4"><animate attributeName="r" calcMode="spline" values="0;30" keyTimes="0;1" dur="1.7" keySplines="0 0.2 0.8 1" begin="0s" repeatCount="indefinite"></animate><animate attributeName="opacity" calcMode="spline" values="1;0" keyTimes="0;1" dur="1.7" keySplines="0.2 0 0.8 1" begin="0s" repeatCount="indefinite"></animate></circle></svg>Show more (#rest# left)</div></div>' });
            if (showMoreConfig.showButton && rest > 0) {
                reqDoc.offset += reqDoc.number;

                let temp = document.createElement('template');
                temp.innerHTML = showMoreConfig.html.replace('#rest#', rest);
                let button = temp.content.firstChild;
                button.firstChild.onclick = () => {
                    // show loading, button gets removed when request finished
                    let loader = document.getElementById('ch-show-more-loader');
                    if (loader) {
                        loader.style = 'display:initial';
                    }
                    requestStream();
                };
                rootNode.appendChild(button);
            }

            let temp = document.createElement('template');
            temp.innerHTML = '<a id="ch-backlink" href="https://contenthub.cloud">via Content Hub</a>';
            let backlink = temp.content.firstChild;

            rootNode.appendChild(backlink);
        };

        xhr.onreadystatechange = function () {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                documentsCallback(JSON.parse(this.response));
            }
        };

        requestStream();
    }
    return {
        setConfig(config) {
            if (config) {
                chConfig = config;
            }
        },
        init(config) {
            this.setConfig(config);

            // check config
            if (chConfig) {
                if (!chConfig.apiKey) {
                    throw new Error('No "apiKey" in chConfig object found.');
                }
                if (!chConfig.projectId) {
                    throw new Error('No "projectId" in chConfig object found.');
                }
                if (chConfig.stream && !chConfig.stream.rootId) {
                    throw new Error('No "rootId" in chConfig.stream object found.');
                }
            } else {
                throw new Error('No "chConfig" object found.');
            }
            replaceTemplateValues();
            initializeStream();
        }
    };
}());

export default ContentHub;
