// Create database tables
async function createTables() {

    try {

        await pool.query(`

        CREATE TABLE IF NOT EXISTS students (

            id SERIAL PRIMARY KEY,

            fullname TEXT NOT NULL,

            email TEXT UNIQUE NOT NULL,

            password TEXT NOT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        );

        CREATE TABLE IF NOT EXISTS admins (

            id SERIAL PRIMARY KEY,

            username TEXT UNIQUE NOT NULL,

            password TEXT NOT NULL

        );

        CREATE TABLE IF NOT EXISTS questions (

            id SERIAL PRIMARY KEY,

            subject TEXT,

            question TEXT,

            option_a TEXT,

            option_b TEXT,

            option_c TEXT,

            option_d TEXT,

            answer TEXT

        );

        CREATE TABLE IF NOT EXISTS results (

            id SERIAL PRIMARY KEY,

            student_email TEXT,

            score INTEGER,

            total INTEGER,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        );

        `);

        console.log("✅ Database Ready");

    } catch(err){

        console.log(err);

    }

}

createTables();
