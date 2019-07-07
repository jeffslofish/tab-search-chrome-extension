chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) { 
  console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension"); 
  if (request.msg == "getContents") 
    sendResponse({ 
      tabContents: document.body.innerText, 
      tabId: request.tabId, 
      tabIndex: request.tabIndex,
      tabTitle: request.tabTitle 
    }); 
});
