const sqlite3 = require('sqlite3').verbose();
const express = require("express");
const bodyParser = require("body-parser");
const passwordValidator = require('password-validator');

const app = express();

var schema = new passwordValidator();

schema
  .is().min(6)
  .is().max(8)
  .has().not().spaces()

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.use(express.json());


let date = new Date();
let today = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
let dbm = new sqlite3.Database(__dirname + '/music.db');
let dbu = new sqlite3.Database(__dirname + '/users.db');


let username = "";
let password = "";
let playlist_name = "";
let playlist_id;

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index1.html");
});


app.get("/signin", function(req, res) {
  res.render("signin1", {
    message_type: "",
    message: ""
  });
});

app.get("/list", function(req, res) {
  var sql_song = "SELECT s.title as title, al.name as album, at.name as artist FROM songs s, albums al, artists at WHERE s.album = al._id AND al.artist = at._id ORDER BY title ASC";
  dbm.all(sql_song, [], function(err, srows) {
    if (err) {
      console.log(err.message);
    }
    var sql_album = "SELECT al.name as album, at.name as artist FROM albums al, artists at WHERE al.artist = at._id ORDER BY al.name ASC";
    dbm.all(sql_album, [], function(err, alrows) {
      if (err) {
        console.log(err.message);
      }
      var sql_artist = "SELECT * FROM artists ORDER BY name ASC";
      dbm.all(sql_artist, [], function(err, arrows) {
        if (err) {
          console.log(err.message);
        }
        res.render("list1", {
          message: "Succesful!",
          songs: srows,
          albums: alrows,
          artists: arrows
        });
      });
    });
  });
});

app.get("/playlist_menu", function(req, res) {
  // var sql_song = "SELECT s.title as title, al.name as album, at.name as artist FROM songs s, albums al, artists at WHERE s.album = al._id AND al.artist = at._id ORDER BY title ASC";
  // dbm.all(sql_song, [], function(err, srows) {
  //   if (err) {
  //     console.log(err.message);
  //   }
    res.render("playlist_menu", {
      show: " "
    });
  });
// });

app.get("/signup", function(req, res) {
  res.render("signup1", {
    message_type: "",
    message: ""
  });
});

app.get("/search", function(req, res) {
  res.render("search1", {
    show: ""
  });
});

app.get("/playlist", function(req, res) {
  res.render("playlist1");
});

app.get("/playlist_view", function(req, res){
  res.render("playlist_view", {playlist:" "});
});

let song_checker = "SELECT s.track as track, s.title as title, al.name as album, at.name as artist FROM songs s, albums al, artists at WHERE s.title = ? COLLATE NOCASE AND s.album = al._id AND al.artist = at._id";
let album_checker = "SELECT s.track as track, s.title as title, al.name as album, at.name as artist FROM songs s, albums al, artists at WHERE al.name = ? COLLATE NOCASE AND s.album = al._id AND al.artist = at._id ORDER BY track ASC";
let artist_checker = "SELECT s.track as track, s.title as title, al.name as album, at.name as artist FROM songs s, albums al, artists at WHERE at.name = ? COLLATE NOCASE AND s.album = al._id AND al.artist = at._id ORDER BY track ASC";
app.post("/search", function(req, res) {
  dbm.get(song_checker, [req.body.searchitem], function(err, srow) {
    if (srow) {
      dbm.all(song_checker, [req.body.searchitem], function(err, song_row) {
        console.log(song_row);
        res.render("search1", {
          show: song_row
        });
      });
    } else {
      dbm.get(album_checker, [req.body.searchitem], function(err, alrow) {
        if (alrow) {
          dbm.all(album_checker, [req.body.searchitem], function(err, album_row) {
            console.log(album_row);
            res.render("search1", {
              show: album_row
            });
          });
        } else {
          dbm.get(artist_checker, [req.body.searchitem], function(err, atrow) {
            if (atrow) {
              dbm.all(artist_checker, [req.body.searchitem], function(err, artist_row) {
                console.log(artist_row);
                res.render("search1", {
                  show: artist_row
                });
              });
            } else {
              console.log("not found");
              res.render("search1", {
                show: "Not Found"
              });
              // res.render("search1", {show: "Sorry! couldn't find your Searched item. Please check for typos."});
            }
          });
        }
      });
    }
  });
});

let oldUserQuery = "SELECT * FROM user WHERE name = ? AND paswd = ? LIMIT 1";
app.post('/signin', function(req, res) {
  if (req.body.oldEmail && req.body.oldPass) {
    username = req.body.oldEmail;
    password = req.body.oldPass;
    dbu.get(oldUserQuery, [req.body.oldEmail, req.body.oldPass], function(err, row) {
      if (row) {
        res.redirect("/list");
        console.log("User signed in successfully!");
      } else {
        res.render("signin1", {
          message_type: "warning",
          message: "Sorry! Couldn't find you. Try Signing Up first."
        });
      }
    });
  }
});


let newUserQuery = "INSERT INTO user (name, paswd, date_of_joining)" + "VALUES (?, ?, ?)";
app.post("/signup", function(req, res) {
  if (schema.validate(req.body.newPass) == true) {
    if (req.body.newEmail && req.body.newPass) {
      dbu.get(oldUserQuery, [req.body.newEmail, req.body.newPass], function(err, row) {
        if (row) {
          console.log("Account already exists. Please Sign In");
          res.render("signup1", {
            message_type: "warning",
            message: "Account already exists. Please Sign In"
          });
        } else {
          username = req.body.newEmail;
          password = req.body.newPass;
          dbu.run(newUserQuery, [req.body.newEmail, req.body.newPass, today], function(err, row) {
            if (err) {
              return console.log(err.message);
            }
            res.redirect("/list");
          });
        }
      });
    }
  } else {
    console.log("Password must be 6 to 8 characters long and cannot contain spaces");
    res.render('signup1', {
      message_type: "danger",
      message: "Password must be 6 to 8 characters long and cannot contain spaces"
    });
  }
});


let new_playlist = "INSERT INTO playlist(pid, pname)" + "VALUES(?,?)";
let update_user = "UPDATE user SET pid = ? WHERE pid IS NULL AND name = ? AND paswd = ?";
app.post("/playlist", function(req, res) {
  if (req.body.playlistitem) {
    playlist_name = req.body.playlistitem;
    dbu.get("SELECT pid FROM user WHERE name = ? AND paswd = ? LIMIT 1", [username, password], function(err, prow) {
      if(prow){
        playlist_id = prow.pid;
      }
    var pid = (playlist_id) ? playlist_id : Math.floor(Math.random() * 10000);
    dbu.run(new_playlist, [pid, req.body.playlistitem], function(err, row) {
      if (err) {
        return console.log(err.message);
      }

      dbu.run(update_user, [pid, username, password], function(err, row) {
        if (err) {
          return console.log(err.message);
        }
        playlist_id = pid;
        res.redirect("/playlist_menu");
      });
    });
    });
  }
});

let playlist_song_checker = "SELECT s.title as title, al.name as album, at.name as artist FROM songs s, albums al, artists at WHERE s.title LIKE ? COLLATE NOCASE AND s.album = al._id AND al.artist = at._id";
let playlist_insert = "INSERT INTO playlist_song(pname, song, album, artist)" + "VALUES(?,?,?,?)";
app.post("/playlist_menu", function(req, res) {
  if (req.body.searchitem != null)
  {
    var pattern = "%" + req.body.searchitem + "%";
        dbm.all(playlist_song_checker, [pattern], function(err, song_row) {
          res.render("playlist_menu", {
            show: song_row,
          });
          dbu.run(playlist_insert,[playlist_name,req.body.song_title,req.body.album_title,req.body.artist_title], function(err, row){
            if (err){
              return console.log(err.message);
            }
          });
        });
  } else {
    console.log("not found");
    res.render("playlist_menu", {
      show: "Not Found"
    });
  }
});

let playlist_search = "SELECT * FROM playlist_song WHERE pname = ?";// AND song NOT NULL";
app.post("/playlist_view", function(req, res){
  if(req.body.pname != null)
  {
    dbu.all(playlist_search,[req.body.pname], function(err, rows){
      if(err)
      {
        return console.log(err.message);
      }
      res.render("playlist_view", {playlist: rows});
    });
  }
  else{
      res.render("playlist_view", {playlist: "Not Found"});
  }
});

app.listen(3000, function(req, res) {
  console.log("server starting at port 3000");
});
