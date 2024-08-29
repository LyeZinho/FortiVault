// We using sqlite for the database, no need to connect to the database
// the database is db.sqlite we using diesel for the ORM
use diesel::prelude::*;
use diesel::result::QueryResult;
use crate::models::User;
use crate::schema::*;
use diesel::sqlite::SqliteConnection;

pub fn create_user(conn: &SqliteConnection, new_user: User) -> QueryResult<usize> {
    diesel::insert_into(users::table)
        .values(&new_user)
        .execute(conn)
}