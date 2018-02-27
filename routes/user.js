const express = require("express"),
      router  = express.Router(),
         User = require("../models/user"), 
middlewareObj = require("../middleware"),
  Campgrounds = require("../models/camps");



router.get("/:id", (req, res) => {
    User.findById(req.params.id, (err, foundUser) => {
        if(err && !foundUser){
            req.flash("error", "the user does not exists");
            res.redirect("/campgrounds");
        }else{
            
            Campgrounds.find().where("author.id").equals(foundUser._id).exec((err, camps) => {
                if(err){
                    console.log(err);
                     req.flash("error", "the user does not exists");
                      res.redirect("/campgrounds");
                }else{
                    res.render("user/show", {user : foundUser, camps : camps});
                 }
             });
        }
    });
   
});

router.get("/:id/edit",middlewareObj.isLoggedIn,(req, res) => {
    User.findById(req.params.id, (err, foundUser) => {
    if (err || !foundUser) { return res.redirect("back"); }
    if (foundUser._id.equals(req.user._id)) {
      res.render("user/edit", { user: foundUser }); 
    } else {
      req.flash("error", "You don't have permission to do that");
      res.redirect("/campgrounds");
    } 
  });
});


router.put("/:id", middlewareObj.isLoggedIn, (req, res) => {
   User.findByIdAndUpdate(req.params.id, req.body.user, (err, updatedUser) => {
    if (err) {
      if (err.name === 'MongoError' || err.code === 11000) {
        // Duplicate email
        req.flash("error", "That email has already been registered.");
        return res.redirect("/user/" + req.params.id);
      } 
      // Some other error
      req.flash("error", "Something went wrong...");
      return res.redirect("/user/" + req.params.id);
    }
    if (updatedUser._id.equals(req.user._id)) {
      res.redirect("/user/" + req.params.id);
    } else {
      req.flash("error", "You don't have permission to do that");
      res.redirect("/campgrounds");
    }
  });
});



module.exports = router;
