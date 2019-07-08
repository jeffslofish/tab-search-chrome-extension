/*global chrome:true*/

let activeUrls = [];

const results = document.getElementById('results');
const storageResults = document.getElementById('storageResults');
const searchBox = document.getElementById('searchText');
const form = document.getElementById('searchForm');
const clearStorageButton = document.getElementById('clearStorage');

clearStorageButton.addEventListener("click", function () {
  chrome.storage.local.clear();
});

form.addEventListener("submit", processForm);
form.addEventListener("submit", processFormForStorage);

// eslint-disable-next-line no-unused-vars
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // sent from another content script, intended for saving source
  activeUrls = request.activeUrls
});


function processFormForStorage(e) {
  if (e.preventDefault) e.preventDefault();

  let searchText = searchBox.value;

  storageResults.innerHTML = "";

  chrome.storage.local.get(['data'], function (result) {
    if (!result.data) {
      return;
    }

    for (let j = 0; j < result.data.length; j++) {
      let url = result.data[j].url;

      if (!activeUrls.find(function (element) {
        return element.url === url;
      })) {
        let tabTitle = result.data[j].tabTitle;
        let favIconUrl = result.data[j].favIconUrl;
        let content = result.data[j].content;

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

          storageResults.innerHTML += "<div class='result'><div class='resultTexts'><a class='closeTab' target='_blank' href='" + url + "'><img class='favicon' src='" + faviconStr + "'><img>" + tabTitle + "</a><p class='context'>" + content.substr(beforeContext, searchText.length + contextAmount * 2) + "</p></div></div>";
        }
      }
    }
  });

  return false;
}

function processForm(e) {
  if (e.preventDefault) e.preventDefault();

  let searchText = searchBox.value;
  let tabContents = [];
  results.innerHTML = "";

  chrome.tabs.query({}, function (tabs) {
    for (let i = 0; i < tabs.length; i++) {

      if (tabs[i].url.substr(0, 4) !== 'http') {
        continue;
      }

      chrome.tabs.executeScript(
        tabs[i].id,
        { file: 'content_script.js' },
        function () {
          chrome.tabs.sendMessage(tabs[i].id, {
            msg: "getContents",
            tabId: tabs[i].id
          }, function (response) {
            if (!response) {
              return;
            }
            let tabId = response.tabId;
            chrome.tabs.get(tabId, function (tab) {
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

                results.innerHTML += "<div class='result'><div class='resultTexts'><p class='tabname' id='tab-" + windowId + "-" + tabIndex + "'><img class='favicon' src='" + faviconStr + "'><img>" + tabTitle + "</p><p class='context'>" + response.tabContents.substr(beforeContext, searchText.length + contextAmount * 2) + "</p></div></div>";

                tabContents.push({ windowId: windowId, tabIndex: tabIndex });

                for (let j = 0; j < tabContents.length; j++) {
                  let windowId = tabContents[j].windowId;
                  let tabIndex = tabContents[j].tabIndex;
                  let tabButton = document.getElementById('tab-' + windowId + '-' + tabIndex);

                  if (tabButton) {
                    tabButton.addEventListener('click', function (el) {
                      let regex = /tab-(\d+)-(\d+)/;
                      let matches = Array.from(el.target.id.matchAll(regex));
                      let windowId = parseInt(matches[0][1], 10);
                      let tabIndex = parseInt(matches[0][2], 10);

                      chrome.windows.update(windowId, { focused: true });
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

  return false;
}
