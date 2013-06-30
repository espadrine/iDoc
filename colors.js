function selectColor(color) {
  var comm = parent.command;
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendRequest(tab.id, {edit:"do",action:comm,arg:color},
    function(response) {
      if(!response.ok) console.log("iDoc com error");
    });
  });
  parent.document.getElementById("colorpalette").style.visibility="hidden";
}

function InitColorPalette() {
  var x;
  if (document.getElementsByTagName)
    x = document.getElementsByTagName('TD');
  else if (document.all)
    x = document.all.tags('TD');
  for (var i=0;i<x.length;i++) {
    x[i].onmouseover = over;
    x[i].onmouseout = out;
    x[i].onclick = click;
  }
}

function over() {
  this.style.border='1px dotted white';
}

function out() {
  this.style.border='1px inset gray';
}

function click() {
  selectColor(this.id);
}

// Initialization.
window.addEventListener('load', InitColorPalette);
