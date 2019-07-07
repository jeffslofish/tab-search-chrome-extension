/*global chrome:true*/

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) { 
  if (request.msg == "getContents") 
    sendResponse({ 
      tabContents: document.body.innerText,
      tabId: request.tabId
    }); 
});
