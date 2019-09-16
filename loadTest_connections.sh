#!/bin/bash
 
COOKIE_JAR="ab-cookie-jar"
COOKIE_NAME="connect.sid"
USERNAME="jonathan"
PASSWORD="Jonathan"
LOGIN_PAGE="http://127.0.0.1:1337/sessions/create"
TEST_PAGE="http://127.0.0.1:1337/feed"

 
curl -i -c $COOKIE_JAR -X POST -d "username=$USERNAME" -d "password=$PASSWORD" $LOGIN_PAGE
SESSION_ID=$(cat $COOKIE_JAR | grep $COOKIE_NAME | cut -f 7)

ab -n 100 -c 10 -v3 -C "$COOKIE_NAME=$SESSION_ID" $TEST_PAGE