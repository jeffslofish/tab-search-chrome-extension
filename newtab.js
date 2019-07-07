let searchButton = document.getElementById('searchButton');
let results = document.getElementById('results');

searchButton.onclick = function (element) {
  let searchText = document.getElementById('searchText').value;
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
            tabId: tabs[i].id,
            tabIndex: tabs[i].index,
            tabTitle: tabs[i].title 
          }, function (response) {

            let content = response.tabContents;
            let tabId = response.tabId;
            let tabIndex = response.tabIndex;
            let tabTitle = response.tabTitle;

            let pos = content.search(searchText);
            if (pos > -1) {
              let contextAmount = 30;
              let beforeContext = pos - contextAmount;
              let afterContext = pos + contextAmount;
  
              if (beforeContext < 0) {
                beforeContext = 0;
              }
              if (afterContext > content.length - 1) {
                afterContext = content.length - 1;
              }
  
              results.innerHTML += "<p id='tab-" + tabIndex + "'>"+ tabTitle +  " ====> " + response.tabContents.substr(beforeContext, contextAmount) + "<b>"+ searchText +"</b>"+ response.tabContents.substr(pos + searchText.length, contextAmount) + "</p>";

              for (let j = 0; j < tabs.length; j++) {  
                let tabButton = document.getElementById('tab-' + j);

                if (tabButton) {
                  tabButton.addEventListener('click', function(el) { 
                    let tabIndexId = parseInt(el.target.id.substr(4), 10);
                    chrome.tabs.highlight({tabs: [tabIndexId]})
                  });
                }
              }
            }
          });
        });
    }
  });
};
