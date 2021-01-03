const bcrypt = require("bcrypt");
const e = require("express");
const { request } = require("express");
class Router {

    constructor(app, db) {
        this.login(app, db);
        this.logout(app, db);
        this.isLoggedIn(app, db);
        this.register(app, db);
        this.displayData(app, db);
        this.search(app, db);
        this.insertMovie(app, db);
        this.deleteMovie(app, db);
        this.searchUser(app, db);
    }

    login(app, db) {
        app.post("/login", (req, res) => {
            let username = req.body.username;
            let password = req.body.password;
            username = username.toLowerCase();
            if (username.length > 12 || password.length > 12) {
                res.json({
                    success: false,
                    msg: "Username/Password too long"
                })
                return
            }
            let cols = [username];
            db.query("SELECT * FROM user WHERE username = ? LIMIT 1", cols, (err, data, fields) => {
                if (err) {
                    res.json({
                        success: false,
                        msg: "Error"
                    })
                    return;
                }
                if (data && data.length === 1) {
                    bcrypt.compare(password, data[0].password, (bcryptErr, verified) => {
                        if (verified) {
                            req.session.userID = data[0].id;
                            res.json({
                                success: true,
                                username: data[0].username
                            })
                            return;
                        }
                        else {
                            res.json({
                                success: false,
                                msg: "invalid password"
                            })
                        }
                    });
                } else {
                    res.json({
                        success: false,
                        msg: "user not found"
                    })
                }
            });
        })
    }

    deleteMovie(app, db) {
        app.post("/doDeleteMovie", (req, res) => {
            let movie = req.body.movie;
            let username = req.body.username;
            let cols = [username];
            db.query("SELECT arr FROM user WHERE username = ? LIMIT 1", cols, (err, data, fields) => {
                var obj = JSON.parse(data[0].arr)
                var i
                for (i = 0; i < obj.length; i++) {
                    if (obj[i].movie == movie)
                        obj.splice(i, 1)
                }
                var myJSON = JSON.stringify(obj)
                data = [myJSON, username]
                db.query('UPDATE user SET arr = ? WHERE username = ?', data, (err, result) => {
                    if (err) throw err;
                })
            });
            res.json({})
        });
    }

    insertMovie(app, db) {
        app.post("/doInsertMovie", (req, res) => {
            let username = req.body.username;
            let cols = [username];
            db.query("SELECT arr FROM user WHERE username = ? LIMIT 1", cols, (err, result, fields) => {
                if (result[0].arr != "null") {
                    try {
                        const sql2 = "INSERT INTO arr (movie, rating) VALUES (?, ?)"
                        var insertIntoThis = result[0].arr;
                        var obj = JSON.parse(insertIntoThis)
                        let sql = 'UPDATE user SET arr = ? WHERE username = ?';
                        var x = { "movie": req.body.item1, "imageURL": req.body.item2 };
                        obj.push(x)
                        var myJSON = JSON.stringify(obj);
                        let data = [myJSON, req.body.username]
                        var obj = JSON.parse(myJSON);
                        db.query(sql, data, (err, result) => {
                            if (err) throw err;
                        });
                    }
                    catch (err) {
                        console.log("Error")
                    }
                    res.json({})
                }
                else {
                    let sql = 'UPDATE user SET arr = ? WHERE username = ?';
                    var y = [{ "movie": req.body.item1, "imageURL": req.body.item2 }];
                    var myJSON = JSON.stringify(y);
                    let data = [myJSON, req.body.username]
                    db.query(sql, data, (err, result) => {
                        if (err) console.log(err);
                    });
                }
            })
        });
    }


    displayData(app, db) {
        app.post("/displayData", (req, res) => {
            let username = req.body.username;
            let cols = [username];
            db.query("SELECT arr FROM user WHERE username = ? LIMIT 1", cols, (err, data, fields) => {
                var x = data[0].arr
                x = JSON.parse(x)
                res.json({
                    array1: x
                })
            });
        });
    }

    logout(app, db) {
        app.post("/logout", (req, res) => {
            if (req.session.userID) {
                req.session.destroy();
                res.json({
                    success: true
                })
                return true;
            }
            else {
                res.json({
                    success: false
                })
                return false;
            }
        });
    }

    isLoggedIn(app, db) {
        app.post("/isLoggedIn", (req, res) => {
            if (req.session.userID) {
                let cols = [req.session.userID];
                db.query("SELECT * FROM user WHERE id = ? LIMIT 1", cols, (err, data, fields) => {
                    if (data && data.length === 1) {
                        res.json({
                            success: true,
                            username: data[0].username
                        })
                        return true;
                    }
                    else {
                        res.json({
                            success: false
                        })
                    }
                });
            }
            else {
                res.json({
                    success: false
                })
            }
        });
    }

    register(app, db) {
        app.post("/register", (req, res) => {
            let username = req.body.username;
            let password = req.body.password;
            username = username.toLowerCase();
            if (username.length > 12 || password.length > 12) {
                res.json({
                    success: false,
                    msg: "Username/Password too long"
                })
                return
            }
            let cols = [username];
            db.query("SELECT * FROM user WHERE username = ? LIMIT 1", cols, (err, data, fields) => {
                if (data && data.length === 1) { //if user is already in database then print error msg
                    res.json({
                        success: false,
                        msg: "User is already registered."
                    })
                    return false;
                }
                else {
                    var sql = "INSERT INTO user (username, password, arr) VALUES ?";
                    const insertUser = 'INSERT INTO user (username, password, arr) VALUES(?, ?, ?)'
                    let pswrd = bcrypt.hashSync(password, 9); //encrypt password with bcrypt
                    db.query(insertUser,
                        [username, pswrd, "[]"], (err, result) => {
                            if (err) throw err;
                        });
                    res.json({
                        success: true,
                        msg: "User has been registered. You may now log in." //displays message if user is registered successfully
                    })
                }
            });

        })
    }

    search(app, db) {
        app.post("/search", (req, res) => {
            let term = req.body.term;
            db.query("SELECT * FROM movieslist WHERE LOWER( movieslist.movie ) LIKE '%" + term + "%'", function (err, result) {
                var string = JSON.stringify(result);
                var x = JSON.parse(string);
                res.json({
                    array1: x
                })
            });
        })
    }

    searchUser(app, db) {
        app.post("/searchUser", (req, res) => {
            let term = req.body.term;
            let cols = [term.toLowerCase()];
            db.query("SELECT arr FROM user WHERE username = ? LIMIT 1", cols, (err, data, fields) => {
                try {
                    var x = data[0].arr
                    x = JSON.parse(x)
                    res.json({
                        array1: x
                    })
                } catch (error) {
                    res.json({
                        array1: []
                    })
                }
            });
        });
    }

}


module.exports = Router;