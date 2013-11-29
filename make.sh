#!/bin/bash

JS=LI

jshint "$JS.js"

jsmin "$JS.js" |
sed '1s/^/javascript:/' |
tr -d '\r\n' >"$JS.min.js"

TITLE='Export LinkedIn connections'
NAME='LinkedIn export contacts'

(
echo -e "<html><body>\n<h1>$TITLE</h1>\n<p>Drag this link to your bookmarks</p>\n"
echo '<a href="'
sed 's/&/\&amp;/g; s/"/\&quot;/g' "$JS.min.js"
echo -e "\">$NAME</a>\n</body></html>"
) > "$JS.html"
