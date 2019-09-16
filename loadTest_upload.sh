#!/bin/bash
 
COOKIE_JAR="ab-cookie-jar"
COOKIE_NAME="connect.sid"
USERNAME="jonathan"
PASSWORD="Jonathan"
POST_DATA="upload-1.bin"
#LOGIN_PAGE="http://127.0.0.1:8100/sessions/create"
LOGIN_PAGE="http://node.cs.ucalgary.ca:8100/sessions/create"
#TEST_PAGE="http://127.0.0.1:8100/photos/create"
TEST_PAGE="http://node.cs.ucalgary.ca:8100/photos/create"

 
curl -i -c $COOKIE_JAR -X POST -d "username=$USERNAME" -d "password=$PASSWORD" $LOGIN_PAGE
SESSION_ID=$(cat $COOKIE_JAR | grep $COOKIE_NAME | cut -f 7)

ab -n 10 -c 1 -v4 -C "$COOKIE_NAME=$SESSION_ID" -p $POST_DATA -T "multipart/form-data; boundary=1111111111" $TEST_PAGE > 10-1.txt
ab -n 10 -c 10 -v4 -C "$COOKIE_NAME=$SESSION_ID" -p $POST_DATA -T "multipart/form-data; boundary=1111111111" $TEST_PAGE > 10-10.txt
ab -n 100 -c 1 -v4 -C "$COOKIE_NAME=$SESSION_ID" -p $POST_DATA -T "multipart/form-data; boundary=1111111111" $TEST_PAGE > 100-1.txt
ab -n 100 -c 10 -v4 -C "$COOKIE_NAME=$SESSION_ID" -p $POST_DATA -T "multipart/form-data; boundary=1111111111" $TEST_PAGE > 100-10.txt
ab -n 100 -c 100 -v4 -C "$COOKIE_NAME=$SESSION_ID" -p $POST_DATA -T "multipart/form-data; boundary=1111111111" $TEST_PAGE > 100-100.txt 
ab -n 500 -c 10 -v4 -C "$COOKIE_NAME=$SESSION_ID" -p $POST_DATA -T "multipart/form-data; boundary=1111111111" $TEST_PAGE > 500-10.txt
