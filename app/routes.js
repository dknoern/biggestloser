var User = require('./models/user');
var Weight = require('./models/weight');
var moment = require('moment');

module.exports = function (app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function (req, res) {
        res.render('index.ejs');
    });


    // show the home page (will also have our login links)
    app.get('/privacy', function (req, res) {
        res.render('privacy.ejs');
    });



    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function (req, res) {

        User.find({}, function (err, users) {

            //Weight.find({email: req.user.facebook.email}, function (err, weights) {
            Weight.find({}, function (err, weights) {

                var myWeights = new Array();

                var results = {};

                var hasToday = false;

                var email = req.user.facebook.email;

                for(var i = 0; i < weights.length; i++) {
                    if(weights[i].email == email){

                        console.log("date value: " + formatDate(weights[i].date) + "now is " + formatDate(new Date()));

                        console.log("email matches: " + weights[i].email + " date: " + weights[i].date);

                        if(formatDate(weights[i].date)==formatDate(new Date())){
                            hasToday = true;
                        }
                        myWeights.push(weights[i])
                    }

                    if(results[weights[i].email] == null){
                        results[weights[i].email] = {};
                        results[weights[i].email].email = weights[i].email;
                        results[weights[i].email].initialWeight = weights[i].weight;
                    }

                    results[weights[i].email].currentWeight = weights[i].weight;
                    results[weights[i].email].loss = results[weights[i].email].initialWeight - results[weights[i].email].currentWeight;
                    results[weights[i].email].lossPercentage = results[weights[i].email].loss / results[weights[i].email].initialWeight * 100.0;
                 }


                //Weight.find({email: req.user.facebook.email}, function (err, weights) {
                User.find({}, function (err, users) {


                    var team = {};
                    for(var j = 0; j < users.length; j++) {
                        team[users[j].facebook.email] = users[j].facebook.photo;
                    }

                    console.log(JSON.stringify(team));


                    res.render('profile.ejs', {
                        user: req.user,
                        users: users,
                        weights: weights,
                        myWeights: myWeights,
                        moment: moment,
                        results: results,
                        hasToday: hasToday,
                        users: team
                    });
                });
            });

        });


    });


    // show the home page (will also have our login links)
    app.post('/weight', function (req, res) {
        console.log('weight entered ' + req.body.weight);


        var weight = new Weight(
            {
                email: req.user.facebook.email,
                weight: req.body.weight
            }
        );

        weight.save(function (err) {
            console.log('saved new weight');
            if (err) return handleError(err);

        });


        res.redirect('/profile');
    });


    // LOGOUT ==============================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
    // LOGIN ===============================
    // show the login form
    app.get('/login', function (req, res) {
        res.render('login.ejs', {message: req.flash('loginMessage')});
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // SIGNUP =================================
    // show the signup form
    app.get('/signup', function (req, res) {
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['public_profile', 'email']}));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    // twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/auth/twitter', passport.authenticate('twitter', {scope: 'email'}));

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));


    // google ---------------------------------

    // send to google to do the authentication
    app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
    app.get('/connect/local', function (req, res) {
        res.render('connect-local.ejs', {message: req.flash('loginMessage')});
    });
    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', {scope: ['public_profile', 'email']}));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback',
        passport.authorize('facebook', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    // twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/connect/twitter', passport.authorize('twitter', {scope: 'email'}));

    // handle the callback after twitter has authorized the user
    app.get('/connect/twitter/callback',
        passport.authorize('twitter', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));


    // google ---------------------------------

    // send to google to do the authentication
    app.get('/connect/google', passport.authorize('google', {scope: ['profile', 'email']}));

    // the callback after google has authorized the user
    app.get('/connect/google/callback',
        passport.authorize('google', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function (req, res) {
        var user = req.user;
        user.local.email = undefined;
        user.local.password = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function (req, res) {
        var user = req.user;
        user.facebook.token = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', isLoggedIn, function (req, res) {
        var user = req.user;
        user.twitter.token = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', isLoggedIn, function (req, res) {
        var user = req.user;
        user.google.token = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });


};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}


function formatDate(date){
    return moment(date).format('MMM DD, YYYY')
}
