use sea_orm::{entity::*, query::*, Database, DbErr, Schema, Set};

mod users;

#[tokio::main]
async fn main() -> Result<(), DbErr> {
    // Connect to the SQLite database
    // let db = Database::connect("sqlite::memory:").await?;
    // Create a new SQLite database file
    let db = Database::connect("sqlite://./db.sqlite?mode=rwc").await?;

    // Create the table using SeaORM's Schema helper
    let schema = Schema::new(db.get_database_backend());

    // Create table if it does not exist
    let stmt = schema.create_table_from_entity(users::Entity);
    db.execute(db.get_database_backend().build(&stmt)).await?;

    // Insert a new user
    let new_user = users::ActiveModel {
        id: NotSet,
        name: Set("John Doe".to_owned()),
        email: Set("johndoe@example.com".to_owned()),
    };

    let result = users::Entity::insert(new_user).exec(&db).await?;
    let user_id = result.last_insert_id;
    
    println!("Inserted user ID: {:?}", user_id);

    // Fetch the user
    let fetched_user: Option<users::Model> = users::Entity::find_by_id(user_id).one(&db).await?;
    println!("Fetched user: {:?}", fetched_user);

    Ok(())
}