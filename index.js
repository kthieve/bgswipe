document.addEventListener('DOMContentLoaded', function () {
  const colorPicker = document.getElementById('colorPicker');
  const changeColorBtn = document.getElementById('changeColorBtn');

  // Load the saved color from storage and set the color picker's value
  chrome.storage.sync.get('color', function (data) {
    colorPicker.value = data.color || '#ffffff';
  });

  // Add a click listener to the button
  changeColorBtn.addEventListener('click', function () {
    const color = colorPicker.value;

    // Save the color to storage
    chrome.storage.sync.set({ color: color });

    // Execute the content script to change the background color
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: setPageBackgroundColor,
        args: [color]
      });
    });
  });
});

// This function will be executed in the context of the active tab
function setPageBackgroundColor(color) {
  document.body.style.backgroundColor = color;
}