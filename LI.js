/*
    LinkedIn Export Contacts tool
    Copyright (C) 2013 DataArt

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

(function(run){
function getDate() {
    return new Date().toISOString().substring(0,16).replace('T',' ');
}

function loadScript(src, callback) {
    var s, r;
    r = false;
    s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = src;
    s.onload = s.onreadystatechange = function () {
        if (!r && (!this.readyState || this.readyState == 'complete')) {
            r = true;
            callback();
        }
    };
    document.body.appendChild(s);
}

function getMemberIds() {
    var el = $('.send-multi-message').removeClass('disabled')[0];
    var old = el.attributes['data-url'].value;
    el.setAttribute('data-url', '#test');
    el.click();
    var ids = window.location.hash.split('=');
    if (ids.length < 2) {
        alert('Please check that some contacts are selected and the right pane contains the contacts list.');
        return [];
    }
    el.setAttribute('data-url', old);
    window.location.hash = null;
    return ids[1].split(',');
}

function processConnDetails(s, flds) {
    var val = {};
    val.Name = $('.connection-name a', s)[0].innerHTML;
    $('dt',s).each(function(){
        var v = $(this).next('dd');
        var vt = v.html();
        var r = vt.match(/['"]mailto:([^'"]*)['"]/);
        if (r != null)
            vt = r[1];
        else if ($('ul li', v).length) {
            vt = $('ul li', v).text();
        } else {
            v.children().remove();
            vt = v.text();
        }
        var f = this.innerHTML;
        flds[f] = 1;
        val[f] = vt;
    });
    return val;
}

function makeCSV(flds, vals) {
    var csv = '';
    csv = $.map(flds,function(v,k){
        var l=k.length-1;
        return '"' + (k[l]===':' ? k.substring(0,l) : k) + '"';
    }).join(',') + '\r\n';

    for (var i=0,l=vals.length; i<l; i++) {
        var val = vals[i];
        csv += $.map(flds,function(v,k){
            return '"' + (val[k] || '').trim().replace('"', '""') + '"';
        }).join(',') + '\r\n';
    }
    outputCSV(csv);
}

function outputCSV(csv) {
    var a = document.createElement('a');
    a.id = 'mysave';
    a.download='LinkedIn connections export ' + getDate() + '.csv';
    a.href='data:application/csv;charset=utf-8,' + encodeURI(csv);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(document.getElementById('mysave'))        
}

function doExport() {
    var ids = getMemberIds();
    var flds = {'Name':1, 'Email:':1,'Title:':1,'Company:':1}, vals = [];
    var cnt_left = ids.length;

    ids.forEach(function (id) {
        $.get('http://www.linkedin.com/people/conn-details', {contactMemberID: id}, function(s){
            --cnt_left;
            try {
                vals.push(processConnDetails(s, flds));
            } catch(e) { console.log(s); }
            if (!cnt_left) makeCSV(flds, vals);
        }).fail(function(){
            cnt_left--;
        });
    });    
}

function init() {
    var footer = $('.abook-footer .outstanding');
    if (footer.length && document.getElementById('export-sel-conns') == null) {
        $('<span> | <span>').appendTo(footer);
  	$('<a id="export-sel-conns" style="cursor:pointer"><strong>Export selected</strong></a>').appendTo(footer).click(doExport);
    }
    if (run) doExport();
}

if (window.location.host != 'www.linkedin.com' || window.location.pathname != '/people/connections') {
    alert('Instructions:\n\nPlease run this script on page http://www.linkedin.com/people/connections\nFor this log in to LinkedIn and go to Contacts > Connections. There select connections you want to export and run this script.');
    return;
}

if (typeof jQuery !== 'function')
    loadScript('http://code.jquery.com/jquery-latest.min.js', init);
else
    init();
})(1);
