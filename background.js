/*global chrome:true*/

let activeUrls = []; // { windowId: id, tabId: id, url: url }

chrome.runtime.onInstalled.addListener(function() {
  console.log("installed");
});

// eslint-disable-next-line no-unused-vars
chrome.management.onEnabled.addListener(function (info) {
  updateActiveUrls();
  chrome.tabs.query({}, function (tabs) {
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].url.substr(0, 6) === 'chrome') {
        continue;
      }

      let tab = tabs[i];
      saveActiveTabContents(tab.id);
    }
  });
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  let windowId = removeInfo.windowId;
  removeActiveUrl(windowId, tabId);
});

function updateActiveUrls() {
  console.log("updateActiveUrls");
  activeUrls = [];

  chrome.tabs.query({}, function (tabs) {
    for (let i = 0; i < tabs.length; i++) {
      chrome.tabs.get(tabs[i].id, function (tab) {
        activeUrls.push({
          windowId: tab.windowId,
          tabId: tab.id,
          url: tab.url
        });
        activeUrlsChanged();
      });
    }
  });
}

// Call this whenever activeUrls is changed
function activeUrlsChanged() {
  chrome.runtime.sendMessage({activeUrls: activeUrls});
}

function removeActiveUrl(windowId, tabId) {
  let index = activeUrls.findIndex(function (element) {
    if (element.windowId === windowId && element.tabId === tabId) {
      return true;
    }
    return false;
  });

  if (index > -1) {
    activeUrls.splice(index, 1);
    activeUrlsChanged();
  }
}

// eslint-disable-next-line no-unused-vars
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    updateActiveUrls();

    let windowId = tab.windowId;
    if (!activeUrls.find(function (element) {
      return element.windowId === windowId && element.tabId == tabId;
    })) {
      saveActiveTabContents(tabId);
    }
  }
});

function saveActiveTabContents(tabId) {
  chrome.tabs.get(tabId, function (tab) {
    if (tab.url.substr(0, 6) === 'chrome') {
      return;
    }

    chrome.tabs.executeScript(
      tab.id,
      { file: 'content_script.js' },
      function () {
        chrome.tabs.sendMessage(tab.id, {
          msg: "getContents",
          tabId: tab.id
        }, function (response) {

          if (response) {
            let tabId = response.tabId;
            chrome.tabs.get(tabId, function (tab) {
              let content = response.tabContents;
              let url = tab.url;
              let tabTitle = tab.title;
              let favIconUrl = tab.favIconUrl;

              chrome.storage.local.get(['data'], function (result) {
                let newData;
                if (result && result.data) {
                  let found = result.data.find(function(element) {
                    if (element.url === url) {
                      return true;
                    }
                  });
                  if (typeof found === 'undefined') {
                    result.data.push({
                      url: url,
                      tabTitle: tabTitle,
                      favIconUrl: favIconUrl,
                      content: content
                    });
                    newData = result.data;
                  }
                } else {
                  newData = [{
                    url: url,
                    tabTitle: tabTitle,
                    favIconUrl: favIconUrl,
                    content: content
                  }];
                }
                chrome.storage.local.set({ 'data': newData });
              });
            });
          }

        });
      }
    );
  });
}
