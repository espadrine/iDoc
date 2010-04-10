// Copyright (c) 2010 Thaddee Tyl. All rights reserved.
// iDoc is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software foundation, version 3.
// iDoc is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.

var name = '';
if(document.location.protocol == 'http:')
	name = document.URL.substring(7);
else if(document.location.protocol == 'file:')
	name = document.URL.substring(8);

// 1. You have to learn to listen!
chrome.extension.onRequest.addListener(
	function( request, sender, sendResponse ) {
		if(request.edit == true) {
			if(document.designMode) {
				if(request.replace) {
					document.open();
					document.write('<!DOCTYPE html>\n<html>'
								   +request.replace+'</html>');
					document.close();
				}
				if(request.name) {
					name = request.name;
					document.title = name;
				}
				else if(request.askName) {
					name = prompt("Name of the file:"); // ask name.
					if(!name) name = 'ThisIsNotAName'; // frivolous name!
				}
				document.designMode = "on";
				sendResponse({ok:true});
			}
			else sendResponse({ok:false});
		}
		else if(request.edit == false) {
			if(document.designMode) {
				document.designMode = "off";
				sendResponse({ok:true, save:name,
				 content: document.getElementsByTagName('html')[0].innerHTML});
			}
			else sendResponse({ok:false});
		}
		else if(request.edit == 'draft') {
			haveSaved = true;
			sendResponse({ok:true, save:name,
			 content: document.getElementsByTagName('html')[0].innerHTML});
		}
		else if(request.edit == "do") {
			if (request.action == "createlink") {
				var szURL = prompt("Enter a URL:", "http://");
				if ((szURL != null) && (szURL != "")) {
					document.execCommand("CreateLink", false, szURL);
				}
			}
			else if (request.action == "insertimage") {
				imagePath = prompt('Enter Image URL:', 'http://');
				if ((imagePath != null) && (imagePath != "")) {
					document.execCommand('InsertImage', false, imagePath);
				}
			}
			else if (request.action == "createtable") {
				rowstext = prompt("enter rows");
				colstext = prompt("enter cols");
				rows = parseInt(rowstext);
				cols = parseInt(colstext);
				if ((rows > 0) && (cols > 0)) {
				  table = document.createElement("table");
				  table.setAttribute("border", "1");
				  table.setAttribute("cellpadding", "2");
				  table.setAttribute("cellspacing", "2");
				  tbody = createElement("tbody");
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
				  insertNodeAtSelection(e.contentWindow, table);
				}
			  }
			else {
				if(request.arg)
					document.execCommand(request.action, false, request.arg);
				else document.execCommand(request.action, false, null);
			}
			sendResponse({ok:true});

		}
		else
			sendResponse({});
	});

// 2. Wiring things up inside the DOM forest.
function insertNodeAtSelection(win, insertNode) {
  var sel = win.getSelection(); // get current selection

  // get the first range of the selection
  // (there's almost always only one range)
  var range = sel.getRangeAt(0);

  sel.removeAllRanges(); // deselect everything

  range.deleteContents();  // remove content of current selection from document

  var container = range.startContainer;  // get location of current selection
  var pos = range.startOffset;

  range = document.createRange();  // make a new range for the new selection

  if(container.nodeType==3 && insertNode.nodeType==3) {
	// if we insert text in a textnode, do optimized insertion
	container.insertData(pos, insertNode.nodeValue);

	// put cursor after inserted text
	range.setEnd(container, pos+insertNode.length);
	range.setStart(container, pos+insertNode.length);
  }
  else {
	var afterNode;
	if(container.nodeType==3) {
	  // when inserting into a textnode
	  // we create 2 new textnodes
	  // and put the insertNode in between

	  var textNode = container;
	  container = textNode.parentNode;
	  var text = textNode.nodeValue;

	  var textBefore = text.substr(0,pos);	  // text before the split
	  var textAfter = text.substr(pos);	  // text after the split

	  var beforeNode = document.createTextNode(textBefore);
	  afterNode = document.createTextNode(textAfter);

	  // insert the 3 new nodes before the old one
	  container.insertBefore(afterNode, textNode);
	  container.insertBefore(insertNode, afterNode);
	  container.insertBefore(beforeNode, insertNode);

	  container.removeChild(textNode);	  // remove the old node
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

// 3. Do you want to lose your edition?
var haveSaved = true;
window.onbeforeunload = function(e) {
	if(document.designMode=='on' && !haveSaved) {
		var asked = "Don't you want to save your edition on your computer "+
			"before leaving?";
		// save it, just in case :)
		chrome.extension.sendRequest({save: document.URL.substring(7),
				content: document.getElementsByTagName('html')[0].innerHTML},
				function(resp){});
		e.returnValue = asked;
		return asked;
	}
}

document.onkeydown = function(e) {
	if(e.keyCode == 83 && (e.ctrlKey||e.metaKey)) // CTRL/Command+S
		haveSaved = true;
	else haveSaved = false;
}

