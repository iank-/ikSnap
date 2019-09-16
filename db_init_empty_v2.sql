-- Database creation script
-- Ian Kabeary

CREATE TABLE user (
	user_id int NOT NULL AUTO_INCREMENT,
	username varchar(256) NOT NULL,
	password varchar(256),
	full_name varchar(256),
	
	PRIMARY KEY (user_id),
	UNIQUE (username)
);

CREATE TABLE photo (
	photo_id int NOT NULL AUTO_INCREMENT,
	owner_user_id varchar(256),
	filename varchar(256),
	photo_folder_path varchar(256),
	thumbnail_folder_path varchar(256),
	date_added date,
	
	PRIMARY KEY (photo_id)
);

CREATE TABLE following (
	follower_user_id varchar(256) NOT NULL,
	following_user_id varchar(256) NOT NULL
);

CREATE TABLE photostream (
	user_id varchar(256),
	photo_id int
);

