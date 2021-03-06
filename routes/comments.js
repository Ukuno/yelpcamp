const express = require("express"),
      router  = express.Router({mergeParams: true}),
  Campgrounds = require("../models/camps"),
      Comment = require("../models/comments"),
middlewareObj = require("../middleware");





// router.get("/new",middlewareObj.isLoggedIn, (req,res) => {
//     Campgrounds.findById(req.params.id, (err,camp) => {
//         if(err || !camp){
//             req.flash("error", "Something went wrong");
//             console.log(err);
//         }else{
//             res.render("comments/new", {camp: camp});
//         }
//     });
    
// });


router.post("/",middlewareObj.isLoggedIn, (req,res) => {
   
   Campgrounds.findById(req.params.id, (err,camp) => {
   
       if(err || !camp){
           req.flash("error", "Something went wrong");
           console.log(err);
       }else{
           Comment.create(req.body.comment, (err, comment) => {
               if(err){
                   req.flash("error", "OOPS something went wrong");
                   console.log(err);
               }else{
                   comment.author.id = req.user._id;
                   comment.author.username = req.user.username;
                   comment.save();
                   camp.comments.push(comment._id);
                   camp.save();
                   req.flash("success", " Successfully created the comment");
                   res.redirect("/campgrounds/"+camp._id);
               }
           });
       }
   });
    
});

// router.get("/:comment_id/edit", middlewareObj.checkCommentOwnership, (req, res) => {
//     Campgrounds.findById(req.params.id, (err, camp) => {
//        if(err || !camp){
//            req.flash("error", "OOPS the campground doesnot exists");
//            return res.redirect("back");
//        } 
       
//        Comment.findById(req.params.comment_id, (err, comment) => {
//             if(err || !comment){
//                   res.redirect("back");
//               }else{
//                   res.render("comments/edit",{ campground_id : req.params.id , comment : comment});
//               }
//           });
//     });
  

// });

router.put("/:comment_id", middlewareObj.checkCommentOwnership, (req,res) => {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedcomment) => {
      if(err){
          req.flash("error", "OOPS something went wrong");
          res.redirect("back");
      } else{
          req.flash("success", "Successfully updated the comment");
          res.redirect("/campgrounds/"+ req.params.id);
      }
    });
    
});

router.delete("/:comment_id", middlewareObj.checkCommentOwnership, (req, res) => {
   Comment.findByIdAndRemove(req.params.comment_id, (err) => {
       if(err){
           req.flash("error", "OOPS something went wrong");
           res.redirect("back");
       }else{
           req.flash("success", "Successfully deleted the comment");
           res.redirect("/campgrounds/"+req.params.id);
       }
   }) 
});



module.exports = router;
