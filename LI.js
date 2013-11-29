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

(function (run) {
    'use strict';
    function getDate() {
        return new Date().toISOString().substring(0, 16).replace('T', ' ');
    }

    function loadScript(src, callback) {
        var s, r;
        r = false;
        s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = src;
        s.onload = s.onreadystatechange = function () {
            if (!r && (!this.readyState || this.readyState === 'complete')) {
                r = true;
                callback();
            }
        };
        document.body.appendChild(s);
    }

    function getMemberIds() {
        return $.map(
            $('.contact-item-view:has(input:checked)').find('.name a'),
            function (v) { return (/li_(\d+)/).exec(v.href)[1]; }
        );
    }

    function processConnDetails(s, flds) {
        var val = {};
        val.Name = $('.connection-name a', s)[0].innerHTML;
        $('dt', s).each(function () {
            var f, v = $(this).next('dd'),
                vt = v.html(),
                r = vt.match(/['"]mailto:([^'"]*)['"]/);
            if (r !== null) {
                vt = r[1];
            } else if ($('ul li', v).length) {
                vt = $('ul li', v).text();
            } else {
                v.children().remove();
                vt = v.text();
            }
            f = this.innerHTML;
            flds[f] = 1;
            val[f] = vt;
        });
        return val;
    }

    function outputCSV(csv) {
        var a = document.createElement('a');
        a.id = 'mysave';
        a.download = 'LinkedIn connections export ' + getDate() + '.csv';
        a.href = 'data:application/csv;charset=utf-8,' + encodeURI(csv);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(document.getElementById('mysave'));
    }

    function makeCSV(flds, vals) {
        var i, l, val, csv = '', qoute_value;
        csv = $.map(flds, function (v, k) {
            l = k.length - 1;
            return '"' + (k[l] === ':' ? k.substring(0, l) : k) + '"';
        }).join(',') + '\r\n';

        qoute_value = function (v, k) {
            return '"' + (val[k] || '').trim().replace('"', '""') + '"';
        };

        for (i = 0, l = vals.length; i < l; i++) {
            val = vals[i];
            csv += $.map(flds, qoute_value).join(',') + '\r\n';
        }
        outputCSV(csv);
    }

    function doExport() {
        var ids = getMemberIds(),
            flds = {'Name': 1, 'Email:': 1, 'Title:': 1, 'Company:': 1}, vals = [],
            cnt_all = ids.length;

        if (!ids.length) {
            alert('Please, specify contacts to process.');
            return;
        }

        (function f() {
            $('#da-box div').text('Processed ' + (cnt_all  - ids.length) + ' / ' + cnt_all + ' contacts');

            if (!ids.length) {
                $('#da-box').remove();
                makeCSV(flds, vals);
                return;
            }
            var mid = ids.shift();
            $.ajax('http://www.linkedin.com/people/conn-details', {
                data: {contactMemberID: mid},
                success: function (s) {
                    try {
                        vals.push(processConnDetails(s, flds));
                    } catch (e) { console.log(s); }
                },
                complete: f
            });
        }());
    }

    function init() {
        $('#da-box').remove();
        $('<div id="da-box"><p>Exporting connections</p><div></div></div>')
        .css({
            'background-color': 'white',
            'border-top': '1px solid #D3D3D3',
            'font': '700 12px arial',
            'line-height': '30px',
            'z-index': 20000,
            'width': '300px',
            'top': '70px',
            'text-align': 'center',
            'position': 'fixed',
            'margin-left': '-150px',
            'left': '50%',
            'box-shadow': '0px 1px 1px rgba(0, 0, 0, 0.15), -1px 0px 0px rgba(0, 0, 0, 0.03), 1px 0px 0px rgba(0, 0, 0, 0.03), 0px 1px 0px rgba(0, 0, 0, 0.12)'
        })
        .find('div')
        .css({
            'height': '70px',
            'line-height': '70px',
            'font-weight': '400',
            'font-size': '16px'
        })
        .addClass('engagement-action-container')
        .parent()
        .appendTo('body');

        if (run) { doExport(); }
    }

    if (window.location.host !== 'www.linkedin.com' || window.location.pathname !== '/contacts/') {
        alert('Instructions:\n\nPlease run this script on page http://www.linkedin.com/contacts/\nFor this log in to LinkedIn and go to Network > Contacts. There select connections you want to export and run this script.');
        return;
    }

    if (typeof jQuery !== 'function') {
        loadScript('http://code.jquery.com/jquery-latest.min.js', init);
    } else {
        init();
    }
}(1));
