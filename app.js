require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport= require("passport");
const passportLocalMongoose= require("passport-local-mongoose");
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


// const bcrypt = require("bcrypt");
// const saltRounds = 10; 

// const encrypt = require("mongoose-encryption");

const app = express();
app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.8.0/userDB",
    { useNewUrlParser: true }
).then(() => {
    console.log("Database connected succesfully");
}).catch((err) => {
    console.error(err);
});


// const userSchema =new mongoose.Schema({
//         email: String,
//         password: String
//     }
// );

const userSchema =new mongoose.Schema({
        username: String,
        password: String
    }
);


// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });
// const User = new mongoose.model("User", userSchema);

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ exampleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get('/', (req, res) => {
    res.render('home');
});

app.get('/auth/google',(req,res)=>{
    passport.authenticate
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get("/secrets", (req,res)=>{
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.render("/login");
    }
    
});

app.get("/logout",(req,res)=>{
    req.logOut((err)=>{
        console.error(err);
    });
    res.redirect("/");
});

app.post("/register",(req,res)=>{
    User.register({username: req.body.username}, req.body.password).then((user)=>{
        passport.authenticate("local")(req, res, ()=>{
            res.redirect("/secrets");
        })

    }).catch((err)=>{
        console.error(err);
        res.redirect("/register");
    })
});

app.post("/login",(req,res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user,(err)=>{
        if (err) {
          console.error(err);  
        } else {
            passport.authenticate("local")(req, res, () => {
            res.redirect("/secrets");
        });
        }
    });
});


app.listen(3000, () => {
    console.log("Server started at port 3000");
});


//using bcrypt
// app.post("/register", (req, res) => {

//     bcrypt.hash(req.body.password, saltRounds).then((hash)=>{
//         const newUser = new User({
//             email: req.body.username,
//             password: hash
//         });

//         newUser.save().then(() => {
//             res.render("secrets")
//             console.log("Succesfully saved new user");
//         }).catch((err) => {
//             console.error(err);
//         });

//     }).catch((err)=>{
//         console.error(err);
//     });
// });

// app.post("/login", (req, res) => {
//     const email = req.body.username;
//     const password = req.body.password;

//     User.findOne({email: email}).then((foundUser)=>{
//         if (foundUser) {
//             bcrypt.compare(password, foundUser.password).then((result)=>{
//                 if (result === true) {
//                     res.render("secrets")
//                     console.log("Succesful login");
//                 } else {
//                     console.log("Password did not match");
//                 }
//             }).catch((err)=>{
//                 console.error(err);
//             });
//         }else{
//             console.log("Email not found");
//         }
//     }).catch((err)=>{
//         console.error(err);
//     });
// });


