Ian Kabeary
> bulk upload password is hardcoded to asdf


Information:

Was not able to get FTP working with node.cs.ucalgary.ca, so it is not deployed. It has been extensively tested on my laptop though.

The database, however, does work, and is using my schema, s513_ikabeary.

connectionTest.js clears the schema and sets up the tables.
Bulk uploads also clear the tables (not the schema) as directed.

Known issues and features unfinished: (due simply to time constraints)
> system does not check if some user is already followed; it includes both a follow and unfollow link (for users that are not the logged in user). These links both are functional.

> system stores passwords in clear text

> no pagination