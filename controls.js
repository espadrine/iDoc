// 1. edit & draft button.

var editor = {};
editor.editing = false;
editor.END_EDIT = "End";
editor.BEGIN_EDIT = "Edit";

function change(obj) {
  /* Switch from editing mode to browsing mode and back again. */
  chrome.tabs.getSelected(null, function(tab) {
    if (editor.editing == false) {
      obj.textContent = editor.END_EDIT;
    } else {
      obj.textContent = editor.BEGIN_EDIT;
    }
    editor.editing = !editor.editing;

    chrome.tabs.sendMessage(tab.id, {edit:editor.editing, name:true},
      function(response) {
        if (!response.ok) { console.log("iDoc communication error"); }
        if (response.save) {
          /* We save the file on end edit. */
          localStorage['iDoc-'+response.save] = response.content;
        }
      }
    );
  });
}

function draft() {
  /* Make a copy of the current work in draft space. */
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendMessage(tab.id, {edit:'draft'}, function(response) {
      if (!response.ok) { console.log("iDoc communication error"); }
      if (response.save) {
        localStorage['iDoc-'+response.save] = response.content;
      }
    });
  });
}


// 2. controls.

editor.command = "";

function InitToolbarButtons() {
  var kids = document.getElementsByTagName('div');

  for (var i=0; i < kids.length; i++) {
    if (kids[i].className == "imagebutton") {
      kids[i].onmouseover = tbmouseover;
      kids[i].onmouseout = tbmouseout;
      kids[i].onmousedown = tbmousedown;
      kids[i].onmouseup = tbmouseup;
      kids[i].onclick = tbclick;
      kids[i].style.border="solid 1px #ebeff9";
      kids[i].style.borderRadius="2px";
    }
  }
}

function tbmousedown(evt) {
  this.firstChild.style.left = 1;
  this.firstChild.style.top = 1;
  this.style.backgroundColor="#d2dbed";
  evt.preventDefault( );
}

function tbmouseup() {
  this.firstChild.style.left = 1;
  this.firstChild.style.top = 1;
  this.style.backgroundColor="#ebeff9";
}

function tbmouseout() {
  this.style.border="solid 1px #ebeff9";
}

function tbmouseover() {
  this.style.border="solid 1px #d2dbed";
}

function getOffsetTop(elm) {
  var mOffsetTop = elm.offsetTop;
  var mOffsetParent = elm.offsetParent;

  while(mOffsetParent){
    mOffsetTop += mOffsetParent.offsetTop;
    mOffsetParent = mOffsetParent.offsetParent;
  }

  return mOffsetTop;
}

function getOffsetLeft(elm) {
  var mOffsetLeft = elm.offsetLeft;
  var mOffsetParent = elm.offsetParent;

  while(mOffsetParent){
    mOffsetLeft += mOffsetParent.offsetLeft;
    mOffsetParent = mOffsetParent.offsetParent;
  }

  return mOffsetLeft;
}

function tbclick() {
  if(!editor.editing) { change(document.getElementById('ed')); }
  var act = this.id;
  if(act == "mail") { // sending mail.
    // special info.
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {edit:"askName"},
        function(r) {
          var subject = r.name;
          var body = r.content;
          // mailto
          var action_url = 'mailto:?';
          if(subject.length > 0)
            action_url += "subject="+encodeURIComponent(subject)+'&';
          if(body.length > 0)
            action_url += "body="+encodeURIComponent(body);
          chrome.tabs.update(tab.id, {url:action_url});
        })
    });
  } else if ((act == "forecolor") || (act == "hilitecolor")) {
    editor.command = act;
    buttonElement = document.getElementById(act);
    var colorpalette = document.getElementById("colorpalette");
    colorpalette.style.left = getOffsetLeft(buttonElement);
    colorpalette.style.top = getOffsetTop(buttonElement) +
        buttonElement.offsetHeight;
    document.body.style.height = "255px";
    colorpalette.style.display = "block";
    colorpalette.style.visibility="visible";
  } else {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {edit:"do",action:act},
        function(response) {
          if(!response.ok) { console.log("iDoc communication error"); }
        });
    });
  }
}

function Select(selectname) {
  var cursel = document.getElementById(selectname).selectedIndex;
  /* First one is always a label */
  if (cursel != 0) {
    var selected= document.getElementById(selectname).options[cursel].value;
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {edit:"do",action:selectname,
          arg:selected}, function(response) {
        if(!response.ok) console.log("iDoc communication error");
        document.getElementById(selectname).selectedIndex = 0;
      });
    });
  }
}

function dismisscolorpalette() {
  var colorpalette = document.getElementById("colorpalette");
  colorpalette.style.visibility = "hidden";
  colorpalette.style.display = "none";
}

/* here be the css button call */
function cssbut() {
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendMessage(tab.id, {edit:"css"}, function(r) {});
  });
}

function newFile() {
  chrome.tabs.create({url:"./new.html",selected:false}, function(tab2) {
    chrome.tabs.sendMessage(tab2.id, {edit:true}, function(r) {
      if(!r.ok) console.log('iDoc communication error.');
    });
  });
}

function init() {
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendMessage(tab.id, {edit:"ask"}, function(response) {
      editor.editing = response.editing;
      document.getElementById('ed').textContent = editor.editing?
          editor.END_EDIT: editor.BEGIN_EDIT; // Edit on.
      document.getElementById('new').style.display = 'none';
      var tables = document.getElementsByTagName('table');
      for(var i=0; i<tables.length; i++)
        tables[i].style.display = "table";
    });
  });
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if(request.save) // It comes from the content script.
        localStorage['iDoc-'+request.save] = request.content;
      sendResponse({});
    }
  );
  InitToolbarButtons();
  document.addEventListener("mousedown", dismisscolorpalette);
}

// Initialize.
window.addEventListener('load', init);
var newButton = document.getElementById('new');
newButton.addEventListener('click', newFile);
var new2Button = document.getElementById('new2');
new2Button.addEventListener('click', newFile);
var edButton = document.getElementById('ed');
edButton.addEventListener('click', function() { change(edButton); });
var draftButton = document.getElementById('draft');
draftButton.addEventListener('click', draft);

// Selectables.
['formatblock', 'fontname', 'fontsize'].forEach(function(id) {
  var e = document.getElementById(id);
  e.addEventListener('change', function() { Select(id); });
});
var cssButton = document.getElementById('css');
cssButton.addEventListener('click', function() { cssbut(cssButton); });

