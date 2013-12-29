#!/bin/sh

./min.sh

# get the current path
CURPATH=`pwd`

#requires inotify-tools
inotifywait -mr --timefmt '%d/%m/%y %H:%M' --format '%T %w %f' \
-e close_write ./src/ | while read date time dir file; do

       FILECHANGE=${dir}${file}
       # convert absolute path to relative
       FILECHANGEREL=`echo "$FILECHANGE" | sed 's_'$CURPATH'/__'`

       ./min.sh
       echo "At ${time} on ${date}, file $FILECHANGE triggered a minify"
       ./automin.sh
done