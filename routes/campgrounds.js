const express = require("express"),
      router  = express.Router(),
  Campgrounds = require("../models/camps"),
middlewareObj = require("../middleware"),
     geocoder = require("geocoder");



function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

router.get("/", (req, res) => {
    const perPage = 8,
        pageQuery = Number(req.query.page),
       pageNumber = pageQuery ? pageQuery : 1,
          noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campgrounds.find({location: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            if(err){
                console.log(err);
            }
            Campgrounds.count({location: regex}).exec(function (err, count) {
                if (err) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(allCampgrounds.length < 1) {
                        noMatch = "No campgrounds match that location, please try again.";
                    }
                    res.render("campgrounds/index", {
                        camps: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    } else {
        // get all campgrounds from DB
        Campgrounds.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            if(err){
                console.log(err);
            }
            Campgrounds.count().exec(function (err, count) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("campgrounds/index", {
                        camps: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
});


router.post("/",middlewareObj.isLoggedIn, (req, res) => {
    // res.send("this is the post");
    const name = req.body.name,
         image = req.body.image,
         price = req.body.price,
          desc = req.body.desc,
        author = {
                  id: req.user._id,
                  username: req.user.username
                };
    geocoder.geocode(req.body.location,  (err, data) => {
        if(err || data.status === 'ZERO_RESULTS'){
            console.log(err);
            req.flash("error", "the given location doesn't exists");
            return res.redirect("/campgrounds/new");
        }else{
                let lat = data.results[0].geometry.location.lat,
                    lng = data.results[0].geometry.location.lng,
               location = data.results[0].formatted_address,
                newCamp = {name:name , image: image , price : price, description: desc, author: author, location: location, lat: lat, lng: lng};
                Campgrounds.create(newCamp, (err , camp) => {
                        if(err){
                            req.flash("error", "opps something went wrong");
                            console.log("opps there is something wrong :-(");
                        }else{
                            console.log("New campground has been added");
                            req.flash("success", "Successfully created new Campground");
                            res.redirect("/campgrounds");
                        }
                    }
                );
        }
    });
});


router.get("/new",middlewareObj.isLoggedIn, (req ,res) => {
   res.render("campgrounds/new" ,{page: 'create'}); 
});

router.get("/:id", (req,res) => {
  Campgrounds.findById(req.params.id).populate("comments").exec(function(err , camp){
      if(err || !camp){
          req.flash("error", "The campground doesn't exists");
          res.redirect("/campgrounds");
          console.log(err);
      }else{
        res.render("campgrounds/show", {camps : camp});  
      }
  });
    
});

router.get("/:id/edit",middlewareObj.checkCampOwnership, (req, res) => {
    
    Campgrounds.findById(req.params.id, (err, camp) => {
       if(err || !camp){
           res.redirect("/campgrounds");
       } else{
            res.render("campgrounds/edit", {camp : camp});
       }
    });
    
   
});


router.put("/:id",middlewareObj.checkCampOwnership, (req , res) => {
    geocoder.geocode(req.body.location,  (err, data) => {
        if(err || data.status === 'ZERO_RESULTS'){
            console.log(err);
            req.flash("error", "the given location doesn't exists");
            return res.redirect("/campgrounds/"+ req.params.id);
        }else{
            let lat = data.results[0].geometry.location.lat,
                lng = data.results[0].geometry.location.lng,
           location = data.results[0].formatted_address,
            newData = {
                name: req.body.name, 
                image: req.body.image, 
                description: req.body.desc,
                price : req.body.price,
                cost: req.body.cost, 
                location: location, 
                lat: lat, 
                lng: lng
                
            };
           Campgrounds.findByIdAndUpdate(req.params.id, newData, (err, updatedcamp) => {
               if(err || !updatedcamp){
                   req.flash("error", err.message);
                   res.redirect("/campgrounds");
               }else{
                   req.flash("success", "Successfully updated the campground");
                   res.redirect("/campgrounds/"+ req.params.id);
               }
            });
            
        }
   }); 
});


router.delete("/:id",middlewareObj.isLoggedIn, middlewareObj.checkCampOwnership, (req, res) => {
  Campgrounds.findByIdAndRemove(req.params.id, (err) => {
      if(err){
          req.flash("error", "OOPS, something went wrong");
          res.redirect("/campgrounds/"+req.params.id);
      } else{
          req.flash("success","Successfully deleted the campground");
          res.redirect("/campgrounds");
      }
  }); 
    
});



module.exports = router;
