var APP_CONFIG = require('../app-config.js');
var User = require('../models/User');
var request = require('superagent');


var jwt = require('jsonwebtoken');
var passport = require('passport');
var JwtStrategy = require("passport-jwt").Strategy;
var ExtractJwt = require("passport-jwt").ExtractJwt;

var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-local').Strategy;

var google = require('googleapis');
var googlePlus = google.plus('v1');
var OAuth2 = google.auth.OAuth2;
var googleAuth = new OAuth2(
  APP_CONFIG.googleConfig.appID,
  APP_CONFIG.googleConfig.appSecret,
  APP_CONFIG.googleConfig.callbackUrl
);


passport.serializeUser(function(user,done){

  done(null, user.id);
});


passport.deserializeUser(function(id, done){
  User.getUserById(id, function(err, user){
    done(err, user);
  });
});


passport.use('jwt', new JwtStrategy(
  {
  jwtFromRequest  : ExtractJwt.fromBodyField('Authorization'),
  secretOrKey     : APP_CONFIG.jwtSecret
  },
  function(jwt_payload, done){
          
    User.getUserById(jwt_payload.id, function(error, user){

      console.log("USER = " + JSON.stringify(user));
      
      if(error){
        console.log("Throwing error: " + error);
        return done(error, false);
      }
      if (user) {
        return done(null, user);
      } else {
        return done("You are not authorized", false);
      }  
    });
    
  }
));


passport.use('local',new LocalStrategy(
  function(username, password, done) {
    

    
    User.getUserByLocalUsername(username, function(err, user){

      if(err){
        console.log("Throwing error");
        throw err;
      }
      if(!user){
        return done(null, false, {message: 'Unknown User'});
      }

      User.comparePassword(password, user.local.password, function(err, isMatch){ 
        if(err){
          console.log("Throwing error");
          throw err;
        }
        if(isMatch){
          return done(null, user);
        } else {
          return done(null, false, {message: 'Invalid password'})
        }
      });
    });
}));

var facebookAuth = function(socialtoken, done) {

    request
    .get('https://graph.facebook.com/me')
    .query({ access_token: socialtoken, fields:"name,email" })
    .set('Accept', 'application/json')        
    .end(function(err, res){

      if (err || !res.ok) { done(err); }
    
      var profile = res.body;

      User.getUserByFacebookId(profile.id, function(err, user){

        if(err){
          console.log("Throwing error");
          throw err;
        }
        if(!user){
         
          var newUser = new User();

          newUser.email = profile.email;
          newUser.name = profile.name;
          newUser.reg_source = 'facebook';
          newUser.facebook.id = profile.id;
          newUser.facebook.token = socialtoken;
    
          User.createFacebookUser(newUser, function(err, user){
            if(err) return done(err);
            return done(null, newUser);
          });
        }
        else{
       
          return done(null, user);          
        }      
    });
    });
};

var googleAuth = function(socialtoken, done) {    



      request
      .get("https://www.googleapis.com/plus/v1/people/me")
      .query({"access_token":socialtoken})
      .set('Accept', 'application/json')        
      .end(function(err, res){
  
        if (err || !res.ok) { done(err); }
  
        User.getUserByGoogleId(res.id, function(err, user){
  
          if(err){
            console.log("Throwing error");
            throw err;
          }
          if(!user){

            var newUser = new User();
  
            newUser.email = res.emails[0].value;
            newUser.name = res.displayName;
            newUser.reg_source = 'google';
            newUser.google.id = res.id;
            newUser.google.token = socialtoken;
      
            User.createGoogleUser(newUser, function(err, user){
              if(err) return done(err);
              return done(null, newUser);
            });
          }
          else{
   
            return done(null, user);          
          }      
      });
      });
  };
  


var express = require('express');
var router = express.Router();


router.post('/login/local', function(req, res) {
  passport.authenticate('local', function(err, user, info){
    if (err) {
      console.log(err);
      return res.status(403).json({message: err});
    }
    if (!user) { 
      return res.status(401).json(info);
    }
    req.logIn(user, function(err) {
      if (err) {
        console.log(err);
        return res.status(403).json({message: err});
      }
      var payload = {id: user._id};
      var token = jwt.sign(payload, APP_CONFIG.jwtSecret);  
      return res.status(200).json({message: 'User has been authorized', token: token});
    });
    })(req, res);
});

router.post('/login/facebook', function(req, res) {




  facebookAuth(req.body.socialtoken, function(err, user, info){
    if (err) {
      console.log(err);
      return res.status(403).json({message: err});
    }
    if (!user) { 
      return res.status(401).json(info);
    }
      var payload = {id: user._id};
      var token = jwt.sign(payload, APP_CONFIG.jwtSecret);  
      return res.status(200).json({message: 'User has been authorized', token: token});
    });
});

router.post('/login/google', function(req, res) {
    
    googleAuth(req.body.socialtoken, function(err, user, info){
      if (err) {
        console.log(err);
        return res.status(403).json({message: err});
      }
      if (!user) { 
        return res.status(401).json(info);
      }
        var payload = {id: user._id};
        var token = jwt.sign(payload, APP_CONFIG.jwtSecret);  
        return res.status(200).json({message: 'User has been authorized', token: token});
      });
});
  


router.post('/register/local', function (req, res) {


  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var email = req.body.email;
  var username = req.body.username;
  var password1 = req.body.password1;
  var password2 = req.body.password2;


  req.checkBody('firstname','First name is required').notEmpty();
  req.checkBody('lastname','Last name is required').notEmpty();
  req.checkBody('email','Email name is required').notEmpty();
  req.checkBody('username','Username is required').notEmpty();    
  req.checkBody('password1','Password is required').notEmpty();
  req.checkBody('password2','Re-enter your password').notEmpty();
  req.checkBody('email','Not a valid email').isEmail();
  req.checkBody('password2','Passwords do not match').equals(password1);
  var errors = req.validationErrors();


  if(errors){
    return res.status(403).json({
      message: 'There was an error in the registration form',
      errors: errors
    })
  } else {
   
    var newUser = new User();
    newUser.name = (firstname + " " + lastname),
    newUser.email = email;
    newUser.reg_source = 'local';
    newUser.local.username = username;
    newUser.local.password = password1;

    try{
      User.createLocalUser(newUser, function(err, user){
        if(err){
          throw err;
        }
        console.log("User has been created: ")
        console.log(user);
      });
    } catch (err) {
      console.log(err);
      res.status(409).json({
        message: 'User registration could not be fulfilled at this time'
      })
    }

    return res.status(200).json({
      message: 'User registered succesfully.'
    })
  }
});

module.exports = router;