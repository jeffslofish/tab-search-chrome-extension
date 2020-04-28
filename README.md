# tab-search-chrome-extension

Search the contents of your open and recently closed tabs, display the results, and click on each result to go to that tab.

## To test in development mode

1. Clone or download this repository
2. Run `npm install` in the cloned or download directory
3. Open the extensions page in chrome through the three dots -> More Tools -> Extensions
4. Turn on developer mode (in the upper right corner of the page)
5. Click "Load unpacked"
6. Select the downloaded (unzipped) folder
7. Open a new tab
8. Type a search term in the search box
9. Click the button or just click enter

At this point a list of tabs will be displayed that have matching content to the search. For each tab, the tab title and 30 characters before and after the search is displayed, with the search term in bold. Click on a search result and that tab will be opened.
