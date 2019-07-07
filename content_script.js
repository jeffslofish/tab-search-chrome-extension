chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) { 
  if (request.msg == "getContents") 
    sendResponse({ 
      tabContents: document.body.innerText, 
      windowId: request.windowId,
      tabId: request.tabId, 
      tabIndex: request.tabIndex,
      tabTitle: request.tabTitle 
    }); 
});
