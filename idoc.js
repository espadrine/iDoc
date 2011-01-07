// Copyright (c) 2010 Thaddee Tyl. All rights reserved.
// iDoc is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software foundation, version 3.
// iDoc is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.

var name = '';
var procol = document.location.protocol;
if     (procol == 'http:') name = document.URL.substring(7);
else if (procol == 'file:') name = document.URL.substring(8);

/* 1. You have to learn to listen! */
chrome.extension.onRequest.addListener(
  function( request, sender, sendResponse ) {
    if (request.edit == true) {
      if (document.designMode) {
        if (request.replace) {
          document.open();
          document.write('<!DOCTYPE html>\n<html>'
                         +request.replace+'</html>');
          document.close();
        }
        if (request.name) {
          if (request.name != true) { name = request.name; }
        } else {
          name = prompt("Name of the file:"); // ask name.
          if (!name) { name = 'ThisIsNotAName'; } // frivolous name!
        }
        document.title = name;
        document.designMode = "on";
        sendResponse({ok:true});
      }
      else { sendResponse({ok:false}); }
    } else if (request.edit == false) {
      if (document.designMode) {
        document.designMode = "off";
        sendResponse({ok:true, save:name,
         content: document.getElementsByTagName('html')[0].innerHTML.replace(/idoc\.js/,'')
        });
      }
      else sendResponse({ok:false});
      
    } else if (request.edit == "ask") {
      if (document.designMode == "on") { sendResponse({editing:true}); }
      else { sendResponse({editing:false}); }

    } else if (request.edit == "askName") {
      var range = document.createRange();
      range.selectNode(document.body);
      var content = '';
      var body = document.body.childNodes;
      for(var i=0; i<body.length; i++) {
        content += body[i].textContent+'\n';
      }
      sendResponse({name:name, content:content});

    } else if (request.edit == 'draft') {
      haveSaved = true;
      sendResponse({
          ok:true,
          save:name,
          content: (function() {
            var doc = document.getElementsByTagName('html')[0].innerHTML;
            doc.replace(/idoc\.js/,''); /* Avoids infinite loops. */
            return doc;
          })()
      });

    } else if (request.edit == "css") {
      var csstext = '';
      if (!document.getElementById('idocCSS')) {
        /* create style element */
        document.body.insertAdjacentHTML('afterbegin',
            '<style id="idocCSS"></style>');
      } else {
        csstext = document.getElementById('idocCSS').innerHTML;
      }
      /* show edit box */
      if (!document.getElementById('idocCSSbox')) {
        /* create box */
        document.body.insertAdjacentHTML('beforeend',
          '<div id="idocCSSbox" style="position:fixed;top:20px;left:20px;text-align:center;background-color:#f3f7fc;border:solid 1px #d2dbed;border-radius:3px;padding:10px;display:block;">'+
          '<textarea id="idocCSStext" rows=10 style="font-family:monospace;"></textarea><br>'+
          '<button id="idocCSSdone">done</button></div>');
      } else {
        document.getElementById('idocCSStext').style.height =
            (window.innerHeight - 60) + 'px';
        document.getElementById('idocCSSbox').style.display = 'block';
        document.getElementById('idocCSSbox').firstChild.value=csstext;
      }
      document.getElementById('idocCSStext').addEventListener('input',
        function() {
          document.getElementById('idocCSS').innerHTML = this.value;
        },false);
      document.getElementById('idocCSSdone').addEventListener('click',
        function() {
          document.getElementById('idocCSSbox').style.display = 'none';
        },false);
      sendResponse({});
      
    } else if (request.edit == "do") {
      if (request.action == "createlink") {
        var szURL = prompt("Enter a URL:", "http://");
        if ((szURL != null) && (szURL != "")) {
          document.execCommand("CreateLink", false, szURL);
        }
      } else if (request.action == "insertimage") {
        imagePath = prompt('Enter Image URL:', 'http://');
        if ((imagePath != null) && (imagePath != "")) {
          document.execCommand('InsertImage', false, imagePath);
        }
      } else if (request.action == "createtable") {
        rowstext = prompt("enter rows");
        colstext = prompt("enter cols");
        rows = parseInt(rowstext);
        cols = parseInt(colstext);
        if ((rows > 0) && (cols > 0)) {
          table = document.createElement("table");
          table.setAttribute("border", "1");
          table.setAttribute("cellpadding", "2");
          table.setAttribute("cellspacing", "2");
          tbody = document.createElement("tbody");
          for (var i=0; i < rows; i++) {
          tr = document.createElement("tr");
          for (var j=0; j < cols; j++) {
            td = document.createElement("td");
            br = document.createElement("br");
            td.appendChild(br);
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
          }
          table.appendChild(tbody);      
          insertNodeAtSelection(window, table);
        }
      } else {
        if (request.arg)
          document.execCommand(request.action, false, request.arg);
        else document.execCommand(request.action, false, null);
      }
      sendResponse({ok:true});

    } else { sendResponse({}); }
  }
);

/* 2. Wiring things up inside the DOM forest. */
function insertNodeAtSelection(win, insertNode) {
  var sel = win.getSelection(); // Get current selection

  // Get the first range of the selection
  // (there's almost always only one range)
  var range = sel.getRangeAt(0);

  sel.removeAllRanges(); // Deselect everything

  range.deleteContents();  // Remove content of current selection from document

  var container = range.startContainer;  // Get location of current selection
  var pos = range.startOffset;

  range = document.createRange();  // Make a new range for the new selection

  if (container.nodeType==3 && insertNode.nodeType==3) {
    // If we insert text in a textnode, do optimized insertion
    container.insertData(pos, insertNode.nodeValue);

    // Put cursor after inserted text
    range.setEnd(container, pos+insertNode.length);
    range.setStart(container, pos+insertNode.length);
  }
  else {
    var afterNode;
    if (container.nodeType==3) {
      // When inserting into a textnode
      // We create 2 new textnodes
      // and put the insertNode in between

      var textNode = container;
      container = textNode.parentNode;
      var text = textNode.nodeValue;

      var textBefore = text.substr(0,pos);    // text before the split
      var textAfter = text.substr(pos);    // text after the split

      var beforeNode = document.createTextNode(textBefore);
      afterNode = document.createTextNode(textAfter);

      // insert the 3 new nodes before the old one
      container.insertBefore(afterNode, textNode);
      container.insertBefore(insertNode, afterNode);
      container.insertBefore(beforeNode, insertNode);

      container.removeChild(textNode);    // remove the old node
    }
    else {
      // else simply insert the node
      afterNode = container.childNodes[pos];
      container.insertBefore(insertNode, afterNode);
    }

    range.setEnd(afterNode, 0);
    range.setStart(afterNode, 0);
  }

  sel.addRange(range);
}

/* 3. Do you want to lose your edition? */
var haveSaved = true;
window.onbeforeunload = function(e) {
  if (document.designMode=='on' && !haveSaved) { //FIXME
    // save it, just in case :)
    chrome.extension.sendRequest({save: name,
        content: document.getElementsByTagName('html')[0].innerHTML.replace(/idoc\.js/,'')},
        function(r){});
  }
}
document.onkeydown = function(e) {
  if (e.keyCode == 83 && (e.ctrlKey||e.metaKey)) { // CTRL/Command+S
    haveSaved = true;
  } else { haveSaved = false; }
}
