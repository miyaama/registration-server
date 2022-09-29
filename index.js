const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");

const tzoffset = new Date().getTimezoneOffset() * 60000;

const port = process.env.PORT || 3000;

const db = mysql.createPool({
  host: "eu-cdbr-west-03.cleardb.net",
  user: "ba4d9726f43dc0",
  password: "6e8329b2",
  database: "heroku_bfe85e05f1fae0e",
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/get", (req, res) => {
  const sqlGet = "SELECT * FROM user";
  db.query(sqlGet, (error, result) => {
    const users = result.map((user) => ({
      ...user,
      registration: new Date(user.registration - tzoffset)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      login: new Date(user.login - tzoffset)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
    }));
    res.send(users);
  });
});

app.post("/api/register", (req, res) => {
  const { email, password, name, status = "active" } = req.body;
  const time = new Date(Date.now() - tzoffset)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  const login = time;
  const registration = time;

  let currentResult;

  const sqlGet = "SELECT * FROM user WHERE email = ?";
  db.query(sqlGet, email, (error, result) => {
    if (error) {
      console.log(error);
    }
    const user = result?.[0];

    if (user) {
      res.send({ message: "E-mail is already used" });
    } else {
      const sqlInsert =
        "INSERT INTO user (email, password, name, login, registration, status) VALUES (?,?,?,?,?,?)";
      db.query(
        sqlInsert,
        [email, password, name, login, registration, status],
        (error, result) => {
          if (error) {
            console.log(error);
            res.sendStatus(error.status);
          }
          res.send(result);
        }
      );
    }
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const sqlUpdate = "UPDATE user SET login = ? WHERE id = ?";

  const sqlInsert = "SELECT * FROM user WHERE email = ? AND password = ? ";
  db.query(sqlInsert, [email, password], (error, result) => {
    if (error) {
      res.send({ error: error });
    }

    if (result.length > 0) {
      const login = new Date(Date.now() - tzoffset)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      db.query(sqlUpdate, [login, result[0].id], (error, result) => {
        if (error) {
          console.log(error);
        }
      });

      res.send(result);
    } else {
      res.send({ message: "Wrong email/password" });
    }
  });
});

app.delete("/api/remove/:id", (req, res) => {
  const { id } = req.params;

  const sqlRemove = "DELETE FROM user WHERE id = ?";
  db.query(sqlRemove, [id], (error, result) => {
    if (error) {
      console.log(error);
    }
  });
});

app.get("/api/get/:id", (req, res) => {
  const { id } = req.params;
  const sqlGet = "SELECT * FROM user WHERE id = ?";
  db.query(sqlGet, id, (error, result) => {
    if (error) {
      console.log(error);
    }
    const user = result?.[0];
    if (!user) {
      res.sendStatus(404);
    } else {
      res.send({ status: user.status });
    }
  });
});

app.put("/api/update/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sqlUpdate = "UPDATE user SET status = ? WHERE id = ?";
  db.query(sqlUpdate, [status, id], (error, result) => {
    if (error) {
      console.log(error);
    }
    res.send(result);
  });
});

// app.listen(5000, () => {
//   console.log("Server is running on port 5000");
// });
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
