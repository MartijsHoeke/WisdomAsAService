'use strict';
var cheerio = require("cheerio");
var request = require("request");
var openkvk = require ('overheid.io') ({
    apikey: '5b140874e1a7b22794b68bfa3464036bc8ad371fa2f50cf5396137ab0fb3ac19',
    dataset: 'kvk'
});
var async = require('async');
var mongo = require('mongodb');
var db = require('monk')('localhost/commevents');
var companies =  db.get('companyresults');
var corpus = db.get('corpus');
var dbGraph = db.get('graph')


exports.find = function(req, res, next){
    console.log("find");
    req.query.lookupValue = req.query.lookupValue ? req.query.lookupValue : '';
    req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
    req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
    req.query.sort = req.query.sort ? req.query.sort : '_id';

    var filters = {};
    if (req.query.lookupValue) {
        filters.lookupValue = new RegExp('^.*?'+ req.query.lookupValue +'.*$', 'i');
    }

    req.app.db.models.BusinessRules.pagedFind({
        filters: filters,
        keys: 'lookupValue  tagCattegory  tagScore  typeBusinessRule cattegorycolor  _id',
        limit: req.query.limit,
        page: req.query.page,
        sort: req.query.sort
    }, function(err, results) {
        if (err) {
            return next(err);
        }

        if (req.xhr) {
            res.header("Cache-Control", "no-cache, no-store, must-revalidate");
            results.filters = req.query;
            console.log("Results XHR ");
            res.send(results);
            res.json(results);
        }
        else {
            results.filters = req.query;
            //res.json(results);
            console.log("Results No XHR ");
            //console.log(results);
            res.render('BusinessRules/index', { data: results.data });


        }

    });
};

exports.read = function(req, res, next){
    req.app.db.models.BusinessRules.findById(req.params.id).exec(function(err, BusinessRules) {
        if (err) {
            return next(err);
        }

        if (req.xhr) {
            res.send(BusinessRules);
        }
        else {
            res.render('BusinessRules/details', { BusinessRules: BusinessRules });
        }
    });
};

exports.add = function(req, res){
    res.render('BusinessRules/add');
};

exports.create = function(req, res, next) {
    console.log('START POST: ');

    var workflow = req.app.utility.workflow(req, res);

    workflow.on('validate', function() {
        console.log('START POST(1) IF FORM CHECK: ');
        if (!req.body.lstTypeBusinessRule) {
            workflow.outcome.errors.push('Please enter a TypeBusinessRule.');
            console.log('TypeBusinessRule niet gevuld');
            return workflow.emit('response');
        }

        if(req.body.lstTypeBusinessRule == 'Zoekwaarde'){
            workflow.emit('createLookupValue');
        }
        if(req.body.lstTypeBusinessRule == 'Cattegorie' || req.body.lstTypeBusinessRule == 'Google zoekwaarde' || req.body.lstTypeBusinessRule == 'Scrape Strategy' || req.body.lstTypeBusinessRule == 'Kamer van Koophandel' || req.body.lstTypeBusinessRule == 'Dictionary' || req.body.lstTypeBusinessRule == 'BuildGraph'){
            console.log('createCattegorie -- Google Zoekwaarde or Scrape Strategy');
            workflow.emit('createCattegorie');
        }
        if(req.body.lstTypeBusinessRule == 'Score') {
            workflow.emit('createScore');
        }


    });

    workflow.on('createLookupValue', function () {
        console.log('STAR POST (2):createLookupValue:');
        var fieldsToSet = {
            typeBusinessRule: req.body.lstTypeBusinessRule,
            lookupValue: req.body.txtLookupValue,
        };
        console.log(fieldsToSet);

        req.app.db.models.BusinessRules.create(fieldsToSet, function (err, BusinessRule) {
            if (err) {
                return workflow.emit('exception', err);
            }

            workflow.outcome.record = BusinessRule;
            // req.flash('success','BusinessRule Added');
            res.location('/BusinessRules');
            res.redirect('/BusinessRules');

        });
    });

    workflow.on('createCattegorie', function () {
        console.log('STAR POST (4):createCattegorie:');


        if (req.body.lstTypeBusinessRule == 'Google zoekwaarde') {
            var url = 'https://www.google.nl/search?q=' + req.body.txtLookupValue;
            var linkContent = [];
            var lstTypeBusinessRule = req.body.lstTypeBusinessRule;

            request(url, function (error, res, body) {
                if (!error) {
                    var $ = cheerio.load(body),
                        links = $('.srg').find('.g').length;
                    console.info(lstTypeBusinessRule);
                    console.info('---- START SEARCHING ELEMENTS ------------');
                    var rank = 0;
                    $('.g').each(function () {
                        var rawLink = $(this).find('a').attr('href');
                        var patern = new RegExp(/(url\?q=https:\/\/www.)/);

                        if (patern.test(rawLink) == true) {
                            var rawLink = $(this).find('a').attr('href');
                            rawLink = rawLink.replace(/(url\?q=https:\/\/www.)/, '');
                            rawLink = rawLink.substring(1, rawLink.indexOf('.'));
                        }
                        else {
                            var rawLink = $(this).find('a').attr('href');
                            rawLink = rawLink.replace(/(url\?q=http:\/\/www.)/, '');
                            rawLink = rawLink.substring(1, rawLink.indexOf('.'));
                        }
                        var content = $(this).find('.st').text();
                        linkContent.push({Link: rawLink, Content: content})


                    });

                    var fieldsToSet = {
                        searchValue: req.body.txtLookupValue,
                        resultValue: linkContent,
                        creationDate: Date()
                    };
                    console.log(fieldsToSet);
                    req.app.db.models.googlesearch.create(fieldsToSet, function (err, BusinessRule) {
                        if (err) {
                            return workflow.emit('exception', err);
                        }
                        workflow.outcome.record = BusinessRule;
                        // req.flash('success','BusinessRule Added');

                    });
                } else {
                    console.log("We’ve encountered an error: " + error);
                }
            });

        }

        if (req.body.lstTypeBusinessRule == 'Kamer van Koophandel') {
            console.info('Kamer van Koophandel');

            var zoekBedrijf = req.body.txtZoekBedrijf;
            console.info(zoekBedrijf);


            var site = 'https://openkvk.nl/zoeken/';
            var SiteParemeter = zoekBedrijf;
            var maxPages = req.body.txtAantalPaginas;

            for (var actPage = 0; actPage < maxPages; actPage++) {

                //  setTimeout(function () {

                var url = site + SiteParemeter + '?page=' + actPage;

                request(url, function (error, response, html) {
                    if (!error) {


                        console.info('url: ' + url + ' is approved ');
                        var $ = cheerio.load(html);

                        $('ul#kvkResults.list-group a').each(function (index, value) {

                            var naam = $('.list-group-item-heading', this).text();
                            var adres = $('.address', this).text();
                            var postcode = $('.zipCode', this).text();
                            var plaats = $('.city', this).text();
                            var companyNumber = $('.companyNumber', this).text();

                            var fieldsToSet = {};


                            fieldsToSet = {
                                companyNumber: companyNumber,
                                naam: naam,
                                adres: adres,
                                postcode: postcode,
                                plaats: plaats,
                                pageNumber: actPage - 1,
                                categorie: SiteParemeter,
                                creationDate: Date()
                            };

                            console.info('');
                            console.info('--------------- start fieldsToSet---------------------------');
                            console.info(fieldsToSet);
                            console.info('--------------- einde fieldsToSet---------------------------');
                            console.info('');


                            console.info('--------------- INSERT OBJECT TO MONGO ---------------------------');
                            req.app.db.models.companyResults.create(fieldsToSet, function (err, companyResults) {
                                if (err) {
                                    console.info(err)
                                }
                                workflow.outcome.record = companyResults;
                            })

                        });
                        console.info('--------------- INSERT OBJECT TO MONGO ---------------------------')
                    }
                    else {
                        console.log("We’ve encountered an error: " + error + ': statuscode: ' + response.statusCode)
                    }
                })
            }
        }

        if (req.body.lstTypeBusinessRule == 'Dictionary') {
            console.info('---------------------- ' + req.body.lstTypeBusinessRule + ' ----------------------------------------');

            //A. Automatisch zoeken
            if (req.body.lstActie == 'Zoeken') {

                // A.1 Set the time out to give the database time tot store the URL in the database
                setTimeout(function () {
                    console.info('---------------------- Zelfstandig naamwoorden ----------------------------------------');
                    var znsite = 'https://nl.wiktionary.org/wiki/Categorie:Zelfstandig-naamwoordsvorm_in_het_Nederlands';
                    var znurl = znsite;

                    // A.1.1 Request for the website and fetch URL to the function
                    request(znurl, function (error, response, html) {
                        if (!error) {
                            console.info(znsite + ': is aproved');
                            var $ = cheerio.load(html);

                            //A.1.1.1 CATCH URLS CONTENT
                            $('table a').each(function (i, el) {
                                var insURL = $(this).attr('href')
                                insURL = insURL.substring(2)
                                insURL = 'https://' + insURL

                                //A.1.1.2 Write content to JSON
                                var fieldsToSet = {
                                    volledigWerkwoord: '',
                                    werkwoordInVerledentijd: '',
                                    voltooiddeelwoord: '',
                                    typeWoord: '',
                                    zelfstandignaamwoord: '',
                                    volgLetter: '',
                                    URL: insURL
                                };

                                // A.1.1.3 Write JSON to MongoDB
                                corpus.insert(fieldsToSet);
                            })

                        }

                        else {
                            console.log("We’ve encountered an error: " + error + ': statuscode: ' + response.statusCode)
                        }
                    })
                }, 5000);

                // B SET TIMEOUT TO GIVE THE DATABASE TIME TO STORE DATA
                setTimeout(function () {
                    // B.1 Find URLS in MongoDb
                    corpus.find({}, {fields: {URL: 1}}).then((docs) => {
                        console.info('Aantal URLS is: ' + docs.length);

                    //B.1.1 LOOP THROUGH URL
                    for (var i = 0; i < docs.length; i++) {
                        var znwURL = docs[i].URL;

                        //B.1.1 GET WEBPAGE FROM URL
                        request(znwURL, function (error, response, html) {
                            if (!error) {
                                // B.1.1.1 GET CONTENT FROM URL
                                var $ = cheerio.load(html);
                                $('.mw-content-ltr li a').each(function (i, el) {
                                    var zelfstandNaamWoord = $(this).text();

                                    // B.1.1.2 WRITE CONTENT TO JSON

                                    var fieldsToSet = {
                                        volledigWerkwoord: '',
                                        werkwoordInVerledentijd: '',
                                        voltooiddeelwoord: '',
                                        typeWoord: 'ZelfstandNaamWoord',
                                        zelfstandignaamwoord: zelfstandNaamWoord,
                                        volgLetter: zelfstandNaamWoord.substring(0, 1),
                                        URL: znwURL
                                    };

                                    // B.1.1.2 WRITE CONTENT TO JSON
                                    corpus.insert(fieldsToSet)

                                })
                                //B.1.2 REMOVE URLS from the Corpus
                                corpus.remove({'typeWoord': ""})
                            }
                            else {
                                console.log("We’ve encountered an error: " + error + ': statuscode: ')

                            }
                        })
                    }
                })
                }, 10000)
            }
            // C HANDMATIG TOEVOEGEN VAN WOORDVORMEN
            if (req.body.lstActie == 'handmatig toevoegen') {
                var txtWoord = req.body.txtWoord
                var lstWoordvorm = req.body.lstWoordvorm
                var fieldToSet = {}


                if (lstWoordvorm == 'ZelfstandigNaamWoord') {
                    var fieldsToSet = {
                        volledigWerkwoord: '',
                        werkwoordInVerledentijd: '',
                        voltooiddeelwoord: '',
                        typeWoord: 'ZelfstandNaamWoord',
                        zelfstandignaamwoord: txtWoord,
                        bijvoegelijknaamwoord: '',
                        volgLetter: txtWoord.substring(0, 1),
                        URL: 'handmatig'
                    }
                }

                if (lstWoordvorm == 'BijvoegelijkNaamWoord') {
                    var fieldsToSet = {
                        volledigWerkwoord: '',
                        werkwoordInVerledentijd: '',
                        voltooiddeelwoord: '',
                        typeWoord: 'BijvoegelijkNaamWoord',
                        zelfstandignaamwoord: '',
                        bijvoegelijknaamwoord: txtWoord,
                        volgLetter: txtWoord.substring(0, 1),
                        URL: 'handmatig'
                    }
                }

                if (lstWoordvorm == 'Volledig werkwoord') {
                    var fieldsToSet = {
                        volledigWerkwoord: txtWoord,
                        werkwoordInVerledentijd: '',
                        voltooiddeelwoord: '',
                        typeWoord: 'Volledig werkwoord',
                        zelfstandignaamwoord: '',
                        bijvoegelijknaamwoord: '',
                        volgLetter: txtWoord.substring(0, 1),
                        URL: 'handmatig'
                    }
                }

                if (lstWoordvorm == 'Verledentijd') {
                    var fieldsToSet = {
                        volledigWerkwoord: '',
                        werkwoordInVerledentijd: txtWoord,
                        voltooiddeelwoord: '',
                        typeWoord: 'Verledentijd',
                        zelfstandignaamwoord: '',
                        bijvoegelijknaamwoord: '',
                        volgLetter: txtWoord.substring(0, 1),
                        URL: 'handmatig'
                    }
                }

                if (lstWoordvorm == 'VoltooidDeelWoord') {
                    var fieldsToSet = {
                        volledigWerkwoord: '',
                        werkwoordInVerledentijd: txtWoord,
                        voltooiddeelwoord: '',
                        typeWoord: 'VoltooidDeelWoord',
                        zelfstandignaamwoord: '',
                        bijvoegelijknaamwoord: '',
                        volgLetter: txtWoord.substring(0, 1),
                        URL: 'handmatig'
                    }
                }

                corpus.insert(fieldsToSet)
            }
        }


        // BuildGraph
        if (req.body.lstTypeBusinessRule == 'BuildGraph') {

            console.info('--------------------------  START ASYNC ------------------------------------');

            var url = 'mongodb://localhost:27017/commevents'
            mongo.connect(url, function (err, db) {

                var locals = {};

                var tasks = [   // Load tweets
                    function (callback) {
                        db.collection('STG_LEADS_AUTOSCHADE').find({}).toArray(function (err, tweets) {
                            if (err) return callback(err);
                            locals.tweets = tweets;
                            callback();
                        });
                    },
                    // Load corpus
                    function (callback) {
                        db.collection('corpus').find({$and: [{typeWoord: "ZelfstandNaamWoord" },{URL:"handmatig"}]}).toArray(function (err, corpus) {
                            if (err) return callback(err);
                            locals.corpus = corpus;
                            callback();
                        });
                    },
                    // Load business rules
                    function (callback) {
                        db.collection('businessrules').find({ typeBusinessRule: "Cattegorie"}).toArray(function (err, businessrules) {
                            if (err) return callback(err);
                            locals.businessrules = businessrules;
                            callback();
                        });
                    },

                ];
                console.info('--------------- async.parallel ------------------------')
                async.parallel(tasks, function (err) {
                    if (err) return next(err);
                    db.close();
                    //console.info(locals.tweets[0].text)
                    //console.info('corpus')
                    //console.info(locals.tweets[0])

                    var stgGraph = []
                    var max_tweet  = 4
                    //var txtTweet = locals.tweets[0].text
                    for (var i = 0; i < max_tweet; i++ ){
                        console.info('-------------- ' + locals.tweets[i].text + '------------------------------------------')
                        console.info(tokenizeTekst(locals.tweets[i].text, locals.corpus, locals.businessrules))
                        //stgGraph.push(tokenizeTekst(locals.tweets[i].text, locals.corpus, locals.businessrules))
                    }


                    //tokenizeTekst(locals.tweets[0].text, locals.corpus, locals.businessrules)
                    //dbGraph.insert(stgGraph)
                    //console.info(Graph)

                })


            })

        }

        if(req.body.lstTypeBusinessRule != 'Dictionary'
            && req.body.lstTypeBusinessRule != 'BuildGraph'
            && req.body.lstTypeBusinessRule != 'Kamer van Koophandel'
            && req.body.lstTypeBusinessRule != 'Google zoekwaarde') {
            console.info('Else Push:');
            console.info(req.body.catValue);

            var fieldsToSet = {
                    typeBusinessRule: req.body.lstTypeBusinessRule,
                    tagCattegory: req.body.txtTagCattegory,
                    cattegoryValue: JSON.parse(req.body.catValue),
                    cattegorycolor: req.body.kleur,
                    creationDate: Date()
                }


            req.app.db.models.BusinessRules.create(fieldsToSet, function (err, BusinessRule) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                workflow.outcome.record = BusinessRule;
                // req.flash('success','BusinessRule Added');
            });
        }



        res.location('/BusinessRules');
        res.redirect('/BusinessRules');


    })

workflow.emit('validate');
}

exports.findApiData = function(req, res, next) {
    console.log('Start findAPIData: ');
    console.info(req.body._id);
    console.info(req.body.updateField);
    console.info(req.body.updateValue);
    var MongoClient = require('mongodb').MongoClient;
    var assert = require('assert');
    var ObjectId = require('mongodb').ObjectID;
    var url = 'mongodb://localhost:27017/commevents';
    var businesRule = {};


    //function updateBusinessRule(updateField, updateValue){
    var lookupValue;
    var typeBusinessRule;
    var tagCattegory;
    var creationDate;
    var lastUpdatedate;
    var tagScore;

    function setBusinessRule(doc){

        lookupValue = "";
        typeBusinessRule = "";
        tagCattegory = "";
        creationDate = Date();
        tagScore = "";
        lastUpdatedate =  Date();

        // (1)Check if the form values ar not empty
        // (1.a) If form value is empty and document(doc) value is not empty replace it with the doc value
        // (1.b) If form value and doc value is empty return empty string

        console.log("Zoeken op:" + req.body.updateField);

        // lookupValue
        if (req.body.updateField == "opzoekwaarde"){
            lookupValue = req.body.updateValue;

            if (doc.typeBusinessRule != null) { typeBusinessRule = doc.typeBusinessRule; }
            if (doc.tagCattegory != null) { tagCattegory = doc.tagCattegory; }
            if (doc.tagScore != null) { tagScore = doc.tagScore; }
            if (doc.creationDate != null) { creationDate = doc.creationDate; }
        }
        // tagCattegory
        if (req.body.updateField == "cattegorie"){
            tagCattegory = req.body.updateValue;

            if (doc.typeBusinessRule != null) { typeBusinessRule = doc.typeBusinessRule; }
            if (doc.lookupValue != null) { lookupValue = doc.lookupValue; }
            if (doc.tagScore != null) { tagScore = doc.tagScore; }
            if (doc.creationDate != null) { creationDate = doc.creationDate; }
        }

        // typeBusinessRule
        if (req.body.updateField == "typeBusinessRule"){
            console.log(" Is ..... typeBusinessRule. De waarde wordt: " + req.body.updateValue  );
            typeBusinessRule = req.body.updateValue;

            if (doc.tagCattegory != null) { tagCattegory = doc.tagCattegory; }
            if (doc.lookupValue != null) { lookupValue = doc.lookupValue; }
            if (doc.tagScore != null) { tagScore = doc.tagScore; }
            if (doc.creationDate != null) { creationDate = doc.creationDate; }
        }

        //creationDate
        if (doc.creationDate != null){
            creationDate = doc.creationDate;
        }

        // return businessrule as object
        businesRule.lookupValue = lookupValue;
        businesRule.typeBusinessRule = typeBusinessRule;
        businesRule.tagCattegory = tagCattegory;
        businesRule.tagScore = tagScore;
        businesRule.creationDate = creationDate;
        businesRule.lastUpdatedate = lastUpdatedate;

        console.log(businesRule);
        return businesRule
    }

    var findBusinessRule = function (db, callback) {
        var cursor = db.collection('businessrules').find({_id: ObjectId(req.body._id)});
        cursor.each(function (err, doc) {
            assert.equal(err, null);
            if (doc != null) {
                var updBusinessRule = setBusinessRule(doc);
                console.log(updBusinessRule);

                db.collection('businessrules').findAndModify(
                    {_id: ObjectId(req.body._id)}, // query
                    [['_id', 'asc']],  // sort order
                    {$set: {lookupValue: updBusinessRule.lookupValue
                          , typeBusinessRule: updBusinessRule.typeBusinessRule
                          , tagCattegory: updBusinessRule.tagCattegory
                    }}, // replacement, replaces only the field "hi"
                    {}, // options
                    function (err, object) {
                        if (err) {
                            console.warn(err.message);  // returns error if no matching object found
                        } else {
                            console.dir(object);
                        }
                    }
                );
            }
        });
      };

    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);

        findBusinessRule(db, function() {
            db.close();
        });
    });

    //res.redirect('/BusinessRules');

    };

exports.updateCattValues = function(req, res, next) {
    console.info('test');
    console.info(req.body.lstTypeBusinessRule);
    console.info(req.body.txtTagCattegory);
    console.info(req.body.CatValue);
};


function tokenizeWerkwoord(sentence) {
    var sentenceNumber = 0;
    var volledigWerkwoord = '';
    var werkwoordInVerledentijd = '';
    var voltooiddeelwoord = '';
    var sentenceJSON = {};
    var typeWerkwoord = '';

    sentence = sentence.replace('ALLE betekenissen van dit woord:(', '');


    if (sentence.indexOf('overgankelijk')) {
        typeWerkwoord = 'overgankelijk werkwoord';
        sentence = sentence.replace('overgankelijk werkwoord;', '')

    }
    if (sentence.indexOf('(werkwoord;')) {
        typeWerkwoord = 'werkwoord';
        sentence = sentence.replace('(werkwoord;', '')

    }


    else {
        typeWerkwoord = 'onovergankelijk werkwoord';
        sentence = sentence.replace('onovergankelijk werkwoord', '')

    }

    sentence = sentence.replace(':(;', '');
    sentence = sentence.replace(':(werkwoord;', '');
    sentence = sentence.replace(':(werkwoord;', '');
    sentence = sentence.replace(')1', '');
    sentence = sentence.replace(':(on', '');
    sentence = sentence.replace('werkwoord', '');
    sentence = sentence.replace(';', '');
    sentence = sentence.replace(',', '');

    var tokenSentence = sentence.split(' ');
    var isVolWerkwoord = 0;
    var isverLededenWoord1 = 0;
    var isVerledenWoord2 = 0;
    var isVolDeelWoord = 2;
    var volDeelWoordCount = 0;


    for (var i = 0; i < tokenSentence.length; i++) {
        // Voledig werkwoord
        if (i == 0) {

            if (tokenSentence[i].substring(tokenSentence[i].length - 2, tokenSentence[i].length) == 'on') {
                volledigWerkwoord = tokenSentence[i].substring(0, tokenSentence[i].length - 2);
                isVolWerkwoord = i
            }
            else {
                volledigWerkwoord = tokenSentence[i];
                isVolWerkwoord = i
            }

        }
        // Verledentijd met 1 woord
        if (i > isVolWerkwoord && (i == 1 && (tokenSentence[i] != 'heeft' && tokenSentence[i] != 'is' && tokenSentence[i] != 'reed'))) {
            werkwoordInVerledentijd = tokenSentence[i];
            isverLededenWoord1 = i
        }

        // Verledentijd met 2 woorden
        if (isverLededenWoord1 == 0 && (i > isVolWerkwoord && (tokenSentence[i] == 'heeft' || tokenSentence[i] == 'is' || tokenSentence[i] == 'reed') ) && i < 3) {
            werkwoordInVerledentijd = werkwoordInVerledentijd + ' ' + tokenSentence[i];
            isVerledenWoord2 = i
        }

        // Voltooiddeelwoord
        if (i >= isVolDeelWoord && volDeelWoordCount < 2 && (i > isverLededenWoord1 || i > isVerledenWoord2 ) && ( i < isverLededenWoord1 | +2 || i < isVerledenWoord2 + 2 )) {
            volDeelWoordCount++;
            voltooiddeelwoord = voltooiddeelwoord + ' ' + tokenSentence[i];
            isVolDeelWoord = i
        }

    }

    var fieldsToSet = {
        volledigWerkwoord: volledigWerkwoord,
        werkwoordInVerledentijd: werkwoordInVerledentijd,
        voltooiddeelwoord: voltooiddeelwoord,
        typeWoord: typeWerkwoord,
        zelfstandignaamwoord: '',
        volgLetter: volledigWerkwoord.substring(0, 1),
        URL: ''
    };

    corpus.insert(fieldsToSet);

    return {
        volledigWerkwoord: volledigWerkwoord,
        werkwoordInVerledentijd: werkwoordInVerledentijd,
        voltooiddeelwoord: voltooiddeelwoord,
        typeWoord: typeWerkwoord,
        zelfstandignaamwoord: '',
        volgLetter: volledigWerkwoord.substring(0, 1),
        URL: ''

    }
}

function tokenizeTekst(tweet, corpus, businessrules) {
    var tweetArray = tweet.split(' ')
    var zelfstandigNaamwoord
    var jsonNodeStructure = []
    var jsonLinkStructure = []
    var countCattegories = 0
    var countZelfstandigNaamwoord = 0
    var matchZNW = []
    var matchZNWFILTER = []
    var masterGroup
    var masterGroupValue
    var masterColor
    var countGroups = 0
    var invalidEntries = 0
    var output


    console.info('tokenizeZelfstandNaamWoorden: ')

    // A. Nodestructure based on the BusinessRules
    for (var b = 0; b < businessrules.length; b++) {
        jsonNodeStructure.push({id: businessrules[b].tagCattegory, group: b + 1, type: 'parent', color: businessrules[b].cattegorycolor })
    }
    //console.info('--- PARENTS -----')
    //console.info(jsonNodeStructure)

    //B. vullen van matchZNW
    tweetArray.forEach(function (item) {
        var patt1 = /[,!:]/g
        var inputItem = item.replace(patt1,'')

        matchZNW.push(wordInCorpus(inputItem,corpus))
    })

    //B.1 Filter ZNW
    //console.info('FILTER ZNW')
    var filterZNW = matchZNW.filter(filterById)


    //console.info(filterZNW)

    //C.1 Bepalen van aantal matchende groepen
    tweetArray.forEach(function (item) {
        var check = wordInCattegory(item, jsonNodeStructure )
        if (check != null && masterGroup == null){
            countCattegories++
            masterGroup = check.group
            masterGroupValue = check.id
            masterColor = check.color
        }
    })

    // C.2 MASTER GROUP toevoegen aan de filter group
    var maxBusinessRuleId  =  jsonNodeStructure.length

    filterZNW.forEach(function (item) {
        maxBusinessRuleId++
        item.group =  masterGroup
        item.type =  'child'
        item.color = masterColor
    })

    //console.info(filterZNW)
    //console.info('------------------------')
    jsonNodeStructure = jsonNodeStructure.concat(filterZNW)

    //console.info(jsonNodeStructure)

    //D CREER LINK STRUCTUUR
    filterZNW.forEach(function (item) {
        jsonLinkStructure.push({source: item.id, target: masterGroupValue, value: masterGroup})
    })

    //console.info(jsonLinkStructure)

    output = {nodes : jsonNodeStructure, links: jsonLinkStructure}

    function filterById(obj) {
        if ('id' in obj) {
            return true
        }
        else {
            invalidEntries++
            return false
        }
    }


    return output

}

function wordInCorpus(word,corpus) {
    var output = {}

    corpus.forEach(function (item){
        //console.info(word + ' == ' + item.zelfstandignaamwoord)
        //console.info(word.toLowerCase())
        if(word.toLowerCase().replace('@','') == item.zelfstandignaamwoord.toLowerCase()){
            //console.info(word + ' == ' + item.zelfstandignaamwoord)
            output = { id: item.zelfstandignaamwoord}

        }
    })
   return output
}

function wordInCattegory(word, cattegory ) {
    var output = {}
    var cleanWord = word.replace('@','')
    cattegory.forEach(function (item) {
        //console.info( cleanWord.toLowerCase() + ' == ' + item.id.toLowerCase() )
        if (cleanWord.toLowerCase() == item.id.toLowerCase()){
            output = {id: item.id, group: item.group, color: item.color}
        }
    })
    return output
}

