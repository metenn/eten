#!/bin/bash

. /home/pi/.nvm/nvm.sh
rm -dr dist/
/home/pi/.nvm/versions/node/v20.2.0/bin/tsc
if [ ! $? -eq 0 ]
then
	echo "Typescript didn't compile :("
	exit
fi
echo "Typescript compiled~ uwu"

while true
do
	/home/pi/.nvm/versions/node/v16.9.1/bin/node dist
	touch data/crashed

	startTimestamp=`cat ./data/uptime`
	endTimestamp=`date +%s`
	uptime=`expr $endTimestamp - $startTimestamp`
	days=`expr $uptime / 86400`

	curl -X POST `cat webhook-link` -H "Content-Type: application/json" --data-binary @- <<DATA
	{
	"content": "<@416162471368327178> (<@257119850026106880>) (@everyone)\n\nETEN HAS WORKED\n$days\nDAYS WITHOUT AN ACCIDENT"
	}
DATA
done
