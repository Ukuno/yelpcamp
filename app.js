var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var Campgrounds = require("./models/camps");
var path = require("path");
var flash = require("connect-flash");
// var seedDB = require("./seeds");
var Comment = require("./models/comments");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var User = require("./models/user");
var methodOverride = require("method-override");
var geocoder = require("geocoder");

app.use(flash());

var commentsRoutes = require("./routes/comments");
var campgroundRoutes = require("./routes/campgrounds");
var indexRoutes = require("./routes/index");
var userRoutes = require("./routes/user");

// seedDB();
//"mongodb://localhost/yelp_camp-v1"
var url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp-v1";
mongoose.connect(url);

app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({extended : true}));

app.set("view engine", "ejs");

app.use(methodOverride("_method"));

app.use(require("express-session")({
    secret : "this time life is getting hard",
    resave : false,
    saveUninitialized : false
}));

app.locals.moment = require('moment');


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});


app.use("/",indexRoutes);
app.use("/campgrounds",campgroundRoutes);
app.use("/campgrounds/:id/comments",commentsRoutes);
app.use("/user", userRoutes);


app.listen(process.env.PORT, process.env.IP, function(){
    console.log("its Live");
});
