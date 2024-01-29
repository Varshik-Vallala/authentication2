const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "userData.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (err) {
    console.log(`DB Error ${err.message}`);
    process.exit(1);
  }
};

//TESTING API

app.get("/users/", async (request, response) => {
  const Query = `SELECT * FROM user`;

  const users = await db.all(Query);

  console.log();

  response.send(users);
});

//API1 Register
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  //   console.log(password, name);

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;

  let dbUser = await db.get(selectUserQuery);

  //   console.log(dbUser);

  if (dbUser === undefined) {
    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log(hashedPassword);

    if (password.length < 5) {
      //   console.log("iam pswd");
      response.status(400);
      response.send("Password is too short");
    } else {
      const insertUserQuery = `
        INSERT INTO user(username, name, password, gender, location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );
        `;

      await db.run(insertUserQuery);

      response.send("User created successfully");
      response.status(200);
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// API @ LOGIN

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;

  let dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3 ChangePassword

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;

  let dbUser = await db.get(selectUserQuery);

  const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);
  console.log(isPasswordMatch);

  if (isPasswordMatch === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
      //   console.log("length checker");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = `
      UPDATE user
      SET password = '${hashedPassword}'
      WHERE 
      username = '${username}';
      `;
      await db.run(updateQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

initializeDbAndServer();

module.exports = app;
