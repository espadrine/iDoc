function newFile() {
  var fileName = prompt("Name of the file:"); // ask name.
  if(!fileName) return;
  localStorage['iDoc-'+fileName] = ' '; // store file info.
  // is it a file or a folder?
  if(fileName.indexOf('/') == -1)
    showFile(fileName, document.getElementById('fsHr').sectionRowIndex+1);
  else {
    var folder = fileName.slice(0,fileName.indexOf('/')+1);
    // we need to see whether the folder already exists.
    var exists = false;
    var rows = document.getElementById('fs').rows;
    for(var i=0; i<rows.length; i++) {
      if(rows[i].getAttribute('id') == 'fold'+folder) {
        exists = true;
        // is the folder open visually?
        if(rows[i].firstChild.textContent[0] != '>') {
          showFile(fileName, i+1);
        }
        break;
      }
    }
    // new folder!
    if( !exists )  showFolder(folder, 0);
  }
}
function showFile(f, place) {
  var fsTable = document.getElementById("fs");
  var fRow = fsTable.insertRow(place);
  // update ui.
  fRow.id = 'file'+f;
  fRow.innerHTML = fileInRow(f);
  hookEvents();
}
function showFolder(f, place) {
  var fsTable = document.getElementById("fs");
  var fRow = fsTable.insertRow(place);
  // update ui.
  fRow.id = 'fold'+f;
  fRow.innerHTML = folderInRow(f);
  hookEvents();
}
function rmFile(file) {
  var ls = localStorage;
  ls.removeItem('iDoc-'+file);
  var id = document.getElementById("file"+file).sectionRowIndex;
  hideFile(id);
  // What if it is the last file of the folder?
  var folder = file.slice(0,file.indexOf('/')+1);
  var stillSome = false;
  for(var i=0; i<ls.length; i++) { // parse through storage data.
    var f = ls.key(i);
    if(f.substring(0,5) == 'iDoc-') f = f.substring(5);
    else continue;
    // We want those that have the same folder as the removed file.
    var folderName = f.slice(0,f.indexOf('/')+1);
    if(folderName == folder)
      stillSome = true;
  }
  if( !stillSome && folder != '' ) // if there is no more file in the folder...
    hideFile(id-1);  // ... remove the folder in the ui.
}
function hideFile(place) {
  document.getElementById("fs").deleteRow(place);
}
function preview(file) {
  var prev = document.getElementById('ifpreview').contentDocument;
  prev.open();
  prev.write('<!DOCTYPE html>\n<html>'+localStorage['iDoc-'+file]+'</html>');
  prev.close();
}
function openFolder(name, caller) {
  var ls = localStorage;
  var iTbl = document.getElementById('fold'+name).sectionRowIndex;
  for(var i=0; i<ls.length; i++) { // parse through storage data.
    var f = ls.key(i);
    if(f.substring(0,5) == 'iDoc-') f = f.substring(5);
    else continue;
    // We want those that are named name.
    var folderName = f.slice(0,f.indexOf('/')+1);
    if(folderName == name) {
      // name.
      var nextName = f.slice(f.indexOf('/'));
      nextName = nextName.slice(0,nextName.indexOf('/')+1);
      // index in table.
      iTbl++;
      // show it.
      showFile(f, iTbl);
    }
  }
  caller.parentNode.previousSibling.textContent = 'v';
  caller.classList.remove('openFolder');
  caller.classList.add('closeFolder');
  hookEvents();
  // TODO: remove
  //caller.addEventListener('click', function() { closeFolder(name, caller); });
  //caller.setAttribute('onclick', "closeFolder('"+name+"', this)");
}
function closeFolder(name, caller) {
  var table = document.getElementById('fs');
  var row = caller.parentNode.parentNode.nextSibling;
  var rowId = row.sectionRowIndex;
  var rowName = row.firstChild.nextSibling.nextSibling.textContent;
  while(rowName.slice(0,rowName.indexOf('/')+1) == name) {
    hideFile(rowId);  // deletes the row (next row = same id).
    row = table.rows[rowId];
    if(row && row.firstChild.nextSibling
       && row.firstChild.nextSibling.nextSibling)
      rowName = row.firstChild.nextSibling.nextSibling.textContent;
    else break;
  }
  caller.parentNode.previousSibling.textContent = '>';
  caller.classList.remove('closeFolder');
  caller.classList.add('openFolder');
  hookEvents();
  // TODO: remove
  //caller.addEventListener('click', function() { openFolder(name, caller); });
  //caller.setAttribute('onclick', "openFolder('"+name+"', this)");
}

var listeners = [];
// register the listeners
function reglist(f) {
  listeners.push(f);
  return f;
}
function rmListeners(dom, event, listeners) {
  for (var i = 0; i < listeners.length; i++)
    dom.removeEventListener(event, listeners[i]);
}
// Make a small closure.
function mkListener(f, filename, dom) {
  return function() { f(filename, dom); };
}
function hookEvents() {
  var oldListeners = listeners.slice(0);
  listeners = [];
  console.log('old listeners', oldListeners.length);
  // hook buttons
  var doms = document.getElementsByClassName('removeFile');
  var filename;
  for (var i = 0; i < doms.length; i++) {   // remove file
    filename = doms[i].dataset.filename;
    rmListeners(doms[i], 'click', oldListeners);
    doms[i].addEventListener('click', reglist(mkListener(rmFile, filename)));
  }
  doms = document.getElementsByClassName('openFile');
  for (var i = 0; i < doms.length; i++) {   // edit file
    filename = doms[i].dataset.filename;
    rmListeners(doms[i], 'click', oldListeners);
    rmListeners(doms[i], 'mouseover', oldListeners);
    doms[i].addEventListener('click', reglist(mkListener(edit, filename)));
    doms[i].addEventListener('mouseover',
        reglist(mkListener(preview, filename)));
  }
  doms = document.getElementsByClassName('openFolder');
  for (var i = 0; i < doms.length; i++) {   // open folder
    filename = doms[i].dataset.filename;
    rmListeners(doms[i], 'click', oldListeners);
    doms[i].addEventListener('click',
        reglist(mkListener(openFolder, filename, doms[i])));
  }
  doms = document.getElementsByClassName('closeFolder');
  for (var i = 0; i < doms.length; i++) {   // close folder
    filename = doms[i].dataset.filename;
    rmListeners(doms[i], 'click', oldListeners);
    doms[i].addEventListener('click',
        reglist(mkListener(closeFolder, filename, doms[i])));
  }
}
function fileRow(fileName) {
  return '<tr id="file'+fileName+'">'+fileInRow(fileName);
}
function fileInRow(fileName) {
  return '<td><td class="small"><a href="#" '
      +'data-filename="'+fileName+'" class="folder removeFile">x</a>'
      +'<td><a href="#" '
      +'data-filename="'+fileName+'" class="name openFile">'
      +fileName+'</a>';
}
function folderRow(folderName) {
  return '<tr id="fold'+folderName+'">'+folderInRow(folderName);
}
function folderInRow(folderName) {
  return '<td class="small">&gt;'
      +'<td colspan=2><a href="#" class="folder openFolder" '
      +'data-filename="'+folderName+'">'+folderName+'</a>';
}


function edit(f) {
  chrome.tabs.create({url:"./new.html"}, function(tab2) {
    chrome.tabs.sendMessage(tab2.id, {edit:true,
                replace:localStorage['iDoc-'+f],
                name:f}, function(r) {
      if(!r.ok) console.log("iDoc communication error");
    });
  });
}


function init() {
  var folders = [];
  var inTable = '';
  var uiFs = document.getElementById('fs');
  // Show a table of current files.
  if(localStorage.length >= 0) {
    var ls = localStorage;
    // First show folders.
    for(var i=0; i<ls.length; i++) {
      var f = ls.key(i);
      if(f.substring(0,5) == 'iDoc-') f = f.substring(5);
      else continue;
      if(f.indexOf('/')!=-1) {
        // We have a folder here.
        // find name of folder.
        var folderName = '';
        if(f.indexOf('/')) folderName = f.substring(0,f.indexOf('/')+1);
        else folderName = f.substring(0,f.indexOf('\\')+1);
        // is this folder already listed?
        var folderAlreadyListed = false; // ...java-lengthed variable ;)
        for(var j=0; j<folders.length; j++)
          if(folders[j] == folderName)
            folderAlreadyListed = true;
        if(!folderAlreadyListed) { // show the folder.
          folders.push(folderName);
          inTable += folderRow(folderName);
        }
      }
    }
    // Then show files in the master directory.
    inTable += '<tr id="fsHr"><td colspan=3><div class=hr></div>';
    for(var i=0; i<ls.length; i++) {
      var f = ls.key(i);
      if(f.substring(0,5) == 'iDoc-') f = f.substring(5);
      else continue;
      if(f.indexOf('/')==-1) // We have a file here.
        inTable += fileRow(f);
    }
  }
  uiFs.innerHTML = inTable;
  hookEvents();
}


// Initialization.
addEventListener('load', init);
document.getElementById('new-file').addEventListener('click', newFile);
