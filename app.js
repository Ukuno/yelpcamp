const  express = require("express"),
           app = express(),
    bodyParser = require("body-parser"),
      mongoose = require("mongoose"),
   Campgrounds = require("./models/camps"),
          path = require("path"),
         flash = require("connect-flash"),
       Comment = require("./models/comments"),
      passport = require("passport");
 LocalStrategy = require("passport-local"),
          User = require("./models/user"),
methodOverride = require("method-override"),
      geocoder = require("geocoder");


// setting the routes
const commentsRoutes = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
         indexRoutes = require("./routes/index"),
          userRoutes = require("./routes/user");

// connection with the database
let url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp-v1";
mongoose.connect(url);

app.use('/public', express.static(path.join(__dirname, 'public'))); // setting the public directory

app.use(bodyParser.urlencoded({extended : true}));  //allows to interpret user input  

app.set("view engine", "ejs"); // set to read all the files with ejs extension in view dir

app.use(flash()); // declear flash messages 

app.use(methodOverride("_method")); // override the method of the browser to required method

app.locals.moment = require('moment'); // set the timestamp and caculate the time since the creation 

//configure session
app.use(require("express-session")({
    secret : process.env.SESSIONKEY,
    resave : false,
    saveUninitialized : false
}));


// configure passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//pass current user to all routes
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});


//set all routes
app.use("/",indexRoutes);
app.use("/campgrounds",campgroundRoutes);
app.use("/campgrounds/:id/comments",commentsRoutes);
app.use("/user", userRoutes);


//set port 
app.listen(process.env.PORT || 8080, () => {
    console.log("its Live");
});
