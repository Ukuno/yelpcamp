const Campgrounds = require("../models/camps"),
          Comment = require("../models/comments");

const middlewareObj = {};

middlewareObj.isLoggedIn = (req,res, next) => {
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in first to do that!");
    res.redirect("/login");
}


middlewareObj.checkCampOwnership = (req,res, next) => {
    if(req.isAuthenticated()){
        Campgrounds.findById(req.params.id, (err, foundcamp) => {
            if(err || !foundcamp){
                req.flash("error", "Campground not found");
                res.redirect("back");
            }else{
                if(foundcamp.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                }else{
                    req.flash("error", "You dont have permission to do that");
                    res.redirect("/campgrounds");
                }
            }
        });
    }else{
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}


middlewareObj.checkCommentOwnership = (req,res, next) => {
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, (err, foundcomment) =>{
            if(err || !foundcomment){
                req.flash("error", "Comment not found");
                res.redirect("back");
            }else{
                
                if(foundcomment.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                }else{
                    req.flash("error", "You dont have permission to do that.");
                    res.redirect("back");
                }
            }
        });
    }else{
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}

module.exports = middlewareObj;