const express = require("express"),
      router  = express.Router(),
     passport = require("passport"),
         User = require("../models/user"),
  Campgrounds = require("../models/camps"),
        async = require("async"),
   nodemailer = require("nodemailer"),
       crypto = require("crypto");




router.get("/", (req ,res) => {
   res.render("landing");
    
});


router.get("/register", (req,res) => {
    res.render("register", {page: 'register'});
});

router.post("/register", (req, res) =>{
    var newUser = new User({
        username : req.body.username , 
        firstName : req.body.firstname, 
        lastName : req.body.lastname,
        email : req.body.email,
        avatar : req.body.avatar
    });
    if(req.body.admin_pw === process.env.ADMIN){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, (err , user) => {
        if(err){
          if (err.name === 'MongoError' || err.code === 11000) {
              // Duplicate email
              req.flash("error", "That email has already been registered.");
              return res.redirect("register");
            } 
            req.flash("error", err.message);
            return res.redirect("register");
        }
        passport.authenticate("local")(req,res,() => {
            req.flash("success", "Welcome to YelpCamp " + user.username.toUpperCase());
            res.redirect("/campgrounds");
        });
    });
});


router.get("/admin", (req, res) => {
    res.render("admin");
});
router.get("/login",(req, res) => {
    res.render("login", {page: 'login'});
});

router.post("/login", passport.authenticate("local",
    {
        successRedirect : "/campgrounds",
        failureRedirect : "/login",
        failureFlash: true
    }),(req,res) => {
        
});




router.get("/logout", (req,res) => {
   req.logout();
   req.flash("success", "logged you out successfully");
   res.redirect("/login");
});




router.get("/forgot", (req, res) => {
   res.render("forgot");
});

router.post('/forgot', (req, res, next) => {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, (err, buf) => {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, (err, user) => {
        if (err || !user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save((err) =>{
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'yelpcampwebapp@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'yelpcampwebapp@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, (err) => {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], (err) =>  {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', (req, res) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
    if (err || !user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', (req, res) => {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
        if (err || !user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, (err) => {
              if(err){
                  req.flash("error", "Passwords do not match.");
                  return res.redirect('back');
              }
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save((err) =>{
                if(err){
                    req.flash("error", "Passwords is no saved.");
                     return res.redirect('back');
                }
              req.logIn(user, (err) => {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'yelpcampwebapp@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'yelpcampwebapp@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, (err) => {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
      if(err){
          req.flash("error", "Something went wrong.");
            return res.redirect('back');
      }
    res.redirect('/campgrounds');
  });
});



module.exports = router;
