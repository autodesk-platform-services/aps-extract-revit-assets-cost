﻿/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Autodesk Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

$(document).ready(function () {
  // first, check if current visitor is signed in
  jQuery.ajax({
    url: '/api/aps/oauth/token',
    success: function (res) {
      // yes, it is signed in...
      $('#autodeskSignOutButton').show();
      $('#autodeskSigninButton').hide();

      $('#refreshSourceHubs').show();
      


      // prepare sign out
      $('#autodeskSignOutButton').click(function () {
        $('#hiddenFrame').on('load', function (event) {
          location.href = '/api/aps/oauth/signout';
        });
        $('#hiddenFrame').attr('src', 'https://accounts.autodesk.com/Authentication/LogOut');
      })

      // and refresh button
      $('#refreshSourceHubs').click(function () {
        $('#sourceHubs').jstree(true).refresh();
      });

      prepareUserHubsTree();
      showUser();
    },
    error: function(err){
      $('#autodeskSignOutButton').hide();
      $('#autodeskSigninButton').show();
    }
  });

  $('#autodeskSigninButton').click(function () {
    jQuery.ajax({
      url: '/api/aps/oauth/url',
      success: function (url) {
        location.href = url;
      }
    });
  })


  $.getJSON("/api/aps/oauth/clientid", function (res) {
    $("#ClientID").val(res.id);
    $("#provisionAccountSave").click(function () {
      $('#provisionAccountModal').modal('toggle');
      $('#sourceHubs').jstree(true).refresh();
      $('#destinationHubs').jstree(true).refresh();
    });
  });  

});



function prepareUserHubsTree() {
  $('#sourceHubs').jstree({
      'core': {
          'themes': { "icons": true },
          'multiple': false,
          'data': {
              "url": '/api/aps/datamanagement',
              "dataType": "json",
              'cache': false,
              'data': function (node) {
                  $('#sourceHubs').jstree(true).toggle_node(node);
                  return { "id": node.id };
              }
          }
      },
      'types': {
          'default': { 'icon': 'glyphicon glyphicon-question-sign' },
          '#': { 'icon': 'glyphicon glyphicon-user' },
          'hubs': { 'icon': 'https://cdn.autodesk.io/dm/xs/a360hub.png' },
          'personalHub': { 'icon': 'https://cdn.autodesk.io/dm/xs/a360hub.png' },
          'bim360Hubs': { 'icon': 'https://cdn.autodesk.io/dm/xs/bim360hub.png' },
          'bim360projects': { 'icon': 'https://cdn.autodesk.io/dm/xs/bim360project.png' },
          'a360projects': { 'icon': 'https://cdn.autodesk.io/dm/xs/a360project.png' },
          'folders': { 'icon': 'glyphicon glyphicon-folder-open' },
          'items': { 'icon': 'glyphicon glyphicon-file' },
          'bim360documents': { 'icon': 'glyphicon glyphicon-file' },
          'versions': { 'icon': 'glyphicon glyphicon-time' },
          'unsupported': { 'icon': 'glyphicon glyphicon-ban-circle' }
      },
      "sort": function (a, b) {
          var a1 = this.get_node(a);
          var b1 = this.get_node(b);
          var parent = this.get_node(a1.parent);
          if (parent.type === 'items') { // sort by version number
              var id1 = Number.parseInt(a1.text.substring(a1.text.indexOf('v') + 1, a1.text.indexOf(':')))
              var id2 = Number.parseInt(b1.text.substring(b1.text.indexOf('v') + 1, b1.text.indexOf(':')));
              return id1 > id2 ? 1 : -1;
          }
          else if (a1.type !== b1.type) return a1.icon < b1.icon ? 1 : -1; // types are different inside folder, so sort by icon (files/folders)
          else return a1.text > b1.text ? 1 : -1; // basic name/text sort
      },
      "plugins": ["types", "state", "sort"],
      "state": { "key": "sourceHubs" }// key restore tree state
  }).on("select_node.jstree", function (evt, data) {
      if (data != null && data.node != null && (data.node.type == 'versions' || data.node.type == 'bim360documents')) {        
        const instanceTree = $('#sourceHubs').jstree(true);
        for (const parentNode in data.node.parents) {
          const currentNode = instanceTree.get_node(data.node.parents[parentNode]);
          if (currentNode.type === "bim360projects") {
            $('#labelProjectHref').text(currentNode.id);
            $('#labelProjectId').text(currentNode.original.project_id);
            break;
          }
        }
        // in case the node.id contains a | then split into URN & viewableId
        if (data.node.id.indexOf('|') > -1) {
          var urn = data.node.id.split('|')[1];
          var viewableId = data.node.id.split('|')[2];
          launchViewer(urn, viewableId);
        }
        else {
          launchViewer(data.node.id);
        }
      }
  });
}



function showUser() {
  jQuery.ajax({
    url: '/api/aps/user/profile',
    success: function (profile) {
      var img = '<img src="' + profile.picture + '" height="20px">';
      $('#userInfo').html(img + profile.name);
    }
  });
}
