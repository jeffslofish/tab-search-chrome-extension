let searchButton = document.getElementById('searchButton');
let results = document.getElementById('results');
let searchBox = document.getElementById('searchText');


var form = document.getElementById('searchForm');
if (form.attachEvent) {
  form.attachEvent("submit", processForm);
} else {
  form.addEventListener("submit", processForm);
}

function processForm(e) {
  if (e.preventDefault) e.preventDefault();

  let searchText = searchBox.value;
  let tabContents = [];
  results.innerHTML = "";

  chrome.tabs.query({}, function (tabs) {
    for (let i = 0; i < tabs.length; i++) {

      if (tabs[i].url.substr(0,6) === 'chrome') {
        continue;
      }

      chrome.tabs.executeScript(
        tabs[i].id,
        { file: 'content_script.js' },
        function() {
          chrome.tabs.sendMessage(tabs[i].id, { 
            msg: "getContents", 
            tabId: tabs[i].id
          }, function (response) {

            let tabId = response.tabId;
            chrome.tabs.get(tabId, function(tab) {
              let content = response.tabContents;
              let windowId = tab.windowId;
              
              let tabIndex = tab.index;
              let tabTitle = tab.title;
              let favIconUrl = tab.favIconUrl;
  
              let pos = content.toLowerCase().search(searchText.toLowerCase());
              if (pos > -1) {
                let contextAmount = 100;
                let beforeContext = pos - contextAmount;
                let afterContext = pos + contextAmount;
    
                if (beforeContext < 0) {
                  beforeContext = 0;
                }
                if (afterContext > content.length - 1) {
                  afterContext = content.length - 1;
                }
  
                let faviconStr = favIconUrl ? favIconUrl : '';
    
                results.innerHTML += "<div class='result'><div class='resultTexts'><p class='tabname' id='tab-" + windowId + "-" + tabIndex + "'><img class='favicon' src='" + faviconStr + "'><img>"+ tabTitle +  "</p><p class='context'>" + response.tabContents.substr(beforeContext, searchText.length + contextAmount * 2) + "</p></div></div>";
  
                tabContents.push({windowId: windowId, tabIndex: tabIndex});
  
                for (let j = 0; j < tabContents.length; j++) {  
                  let windowId = tabContents[j].windowId;
                  let tabIndex = tabContents[j].tabIndex;
                  let tabButton = document.getElementById('tab-' + windowId + '-' + tabIndex);
  
                  if (tabButton) {
                    tabButton.addEventListener('click', function(el) { 
                      regex = /tab-(\d+)-(\d+)/;
                      let matches = Array.from( el.target.id.matchAll(regex) );
                      let windowId = parseInt(matches[0][1], 10);
                      let tabIndex = parseInt(matches[0][2], 10);
                      
                      chrome.windows.update(windowId, {focused: true});
                      chrome.tabs.highlight({
                        windowId: windowId,
                        tabs: [tabIndex]
                      })
                    });
                  }
                }
              }
            });
          }); 
        });
    }
  });

  // You must return false to prevent the default form behavior
  return false;
}

