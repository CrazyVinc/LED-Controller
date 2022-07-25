const http = require('http');
var path = require('path');
var fs = require('fs');

var express = require('express');
var session = require('express-session');
const {Op} = require('sequelize');

const bcrypt = require("bcryptjs");

const SequelizeStore = require("express-session-sequelize")(session.Store);

const { socketConnection } = require("./SocketIO");
const app = express();
const server = http.createServer(app);
socketConnection(server);

const config = require("./ConfigManager");
const { connection, sequelize, models } = require("./Database");

const sessionStore = new SequelizeStore({
    db: sequelize,
});

app.set('view engine', 'ejs');
app.use(session({
    secret: 'secret',
    resave: true,
    store: sessionStore,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 },
}));

// Authentication and Authorization Middleware
var auth = async (req, res, next) => {
  if(req.session.loggedin) { /* Look if the user is logged in */
    const user = await models.accounts_model.findOne({
      where: {
        token: req.session.token,
        username: req.session.username
      }
    });
    if(!user) { /* Destroy session if user does not exist in the database */
      req.session.destroy();
      return res.status(403).redirect('/');
    }

    await models.accounts_model.update({ last_login: new Date() }, { /* Update the last_login value */
      where: {
        token: req.session.token,
        username: req.session.username
      }
    });
    
    user.dataValues.meta = JSON.parse(user.dataValues.meta); /* TODO document this */
    if(user.dataValues.meta?.Only) {
      user.dataValues.meta.Only.push('/home');
      var match = user.dataValues.meta.Only.filter(s => s.includes(req.url));
      
      if(match.length == 0) {
        if(match.home) return res.redirect(match.home);
        return res.redirect('/home');
      }
    }

    if (typeof req.session.CheckFree !== 'undefined' && req.session.username && req.session.token) {
      if(req.session.CheckFree == 0) { /* */
        if(user.dataValues.token !== req.session.token) return () => { /* Destroy the session if the token is not the same */
          req.session.destroy();
          res.status(403).redirect('/');
        }
        req.session.CheckFree = 3;
        return next();
      } else {
        req.session.CheckFree--
        return next();
      }
    }
  }
  return res.status(403).redirect('/');
};

app.get("/", function (req, res) {
    if (req.query.logout !== undefined) {
        req.session.destroy(function () {
            res.render("login");
        });
    } else if (req.session.loggedin || !config.config.get().Other.Auth) {
        res.redirect("/home");
    } else {
        res.render("login");
    }
});

app.use(express.urlencoded({extended: true}));

app.all("/auth", async (req, res) => {
    var username = (req.body.username || req.query.auth.split(";")[0]);
    var password = (req.body.password || req.query.auth.split(";")[1]);
	if (username && password) {
        const user = await models.accounts_model.findOne({
            where: {
                [Op.or]: [
                    { "email": username },
                    { "username": username }
                ]
            }
        });

        if(!user) return res.send('No valid username and / or password found!');

        if(user.authenticate(password)) {
            req.session.loggedin = true;
            req.session.CheckFree = 3;
            req.session.username = user.dataValues.username;
            req.session.token = user.dataValues.token;
            res.redirect('/home');
        } else if(user.dataValues.password == password) {
            var salt = bcrypt.genSaltSync(12);
            password = bcrypt.hashSync(password, salt);
            await models.accounts_model.update({ password: password }, {
            where: {
                id: user.dataValues.id
            }
            });
            res.render('errors', {error: 'Password is updated with encryption! Please login again!'});
        } else {
            res.render('errors', {error: 'Incorrect Username and/or Password!'});
        }
    } else {
		res.render('errors', {error: 'Please enter Username and Password!'});
	}
});

app.use("/assets", auth, express.static("assets"));

app.use("/", auth, require("./routes/index"));
app.use("/modal", auth, require("./routes/modal"));
app.use("/test", auth, require("./routes/test"));
app.use("/users", auth, require("./routes/users"));
app.use("/new", auth, require("./routes/new"));
app.use("/api", auth, require("./routes/api"));
app.use("/upload", auth, require("./routes/upload"));

var updates = require("./routes/updates");
app.use(updates.path, auth, updates.app);

app.use("/Settings", auth, require("./routes/Settings"));

app.get("*", function (req, res) {
    res.status(404).render("errors", { error: { code: "404" } });
});

app.set("port", config.config.get().port);
server.listen(app.get("port"), () => {
    require("./SocketController");
    console.log(
        "The LEDController server is running on port:",
        app.get("port")
    );
});
