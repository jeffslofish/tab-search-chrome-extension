/*global chrome:true*/

chrome.runtime.onInstalled.addListener(function () {
  console.log("runtime.onInstalled");
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) { 
  console.log("runtime.onMessage");

  if (request.msg == "saveTabData") {
    saveAllTabContents();
  }
});

// eslint-disable-next-line no-unused-vars
chrome.management.onEnabled.addListener(function (info) {
  console.log("management.onEnabled");

  saveAllTabContents();
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  console.log("tabs.onRemoved");

  let windowId = removeInfo.windowId;

  chrome.storage.local.get(['data'], function (result) {
    if (result && result.data) {
      let index = result.data.findIndex(function (element) {
        if (element.windowId === windowId && element.tabId === tabId) {
          return true;
        }
      });
      if (index > -1) {
        result.data[index].active = false;
        chrome.storage.local.set({ 'data': result.data });
      }
    }
  });
});

// eslint-disable-next-line no-unused-vars
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  console.log("tabs.onUpdated");

  if (changeInfo.status === 'complete') {
    saveTabContents(tabId);
  }
});

function saveAllTabContents() {
  chrome.tabs.query({}, function (tabs) {
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].url.substr(0, 4) !== 'http') {
        continue;
      }

      let tab = tabs[i];
      saveTabContents(tab.id);
    }
  });
}

function saveTabContents(tabId) {
  chrome.tabs.get(tabId, function (tab) {
    if (tab.url.substr(0, 4) != 'http') {
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
                  let found = result.data.find(function (element) {
                    if (element.url === url) {
                      return true;
                    }
                  });
                  if (typeof found === 'undefined') {
                    result.data.push({
                      active: true,
                      windowId: tab.windowId,
                      tabId: tab.id,
                      url: url,
                      tabTitle: tabTitle,
                      favIconUrl: favIconUrl,
                      content: content
                    });
                    newData = result.data;
                  }
                } else {
                  newData = [{
                    active: true,
                    windowId: tab.windowId,
                    tabId: tab.id,
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
