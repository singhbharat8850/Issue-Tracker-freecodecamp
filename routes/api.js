/* *
*
*       Complete the API routing below
*
* */

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function(app) {

  app.route('/api/issues/:project')
    
  .get(function(req, res) {
    var project = req.params.project;
    var filter = req.query;
    if (filter.open) {
      if (filter.open == 'true') {
        filter.open = true;
      } else if (filter.open == 'false') {
        filter.open = 'false';
      }
    }

    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      db.collection(project).find(filter).toArray((err, docs) => {
        if (err)
          console.log(err);
        res.json(docs);

        db.close();
      });
    });

  })
    
  .post(function(req, res) {
    var project = req.params.project;
    var body = req.body;
    if (!body.issue_title.replace(/\s/g, '').length || !body.issue_text.replace(/\s/g, '').length || !body.created_by.replace(/\s/g, '').length) {
      res.json('missing required input');
    } else {
      var newIssue = {
        issue_title: body.issue_title,
        issue_text: body.issue_text,
        created_by: body.created_by,
        assigned_to: body.assigned_to || "",
        status_text: body.status_text || "",
        created_on: new Date(),
        updated_on: new Date(),
        open: true
      }

      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection(project).insertOne(newIssue, (err, docs) => {
          if (err)
            res.json(err);
          res.json(docs.ops[0]);

          db.close();
        });
      });
    }
  })
    
  .put(function(req, res) {
    var project = req.params.project;
    var body = req.body;
    var _id = body._id
    var filterPut = {
      _id: ObjectId(_id)
    }
    function clean(myObj) {
      Object.keys(myObj).forEach((key) => (myObj[key] == '') && delete myObj[key]);
      return myObj
    }
    var updateIssue = clean(body);
    delete updateIssue['_id'];

    if (Object.keys(updateIssue).length === 0) {
      res.json('no updated field sent');
    } else {
      updateIssue.updated_on = new Date();
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection(project).updateOne(filterPut, {
          $set: updateIssue
        }, (err, docs) => {
          if (err)
            console.log(err);
          if (docs.result.n === 0) {
            res.json('could not update ' + _id);
          } else {
            res.json('successfully updated ' + _id);
          };
          db.close();
        });
      });
    }
  })
    
  .delete(function (req, res){  
      var project = req.params.project;    
      var body = req.body;
      var _id = body._id;    
      const regex = /^[0-9a-fA-F]{24}$/
      if (_id.match(regex) == null) {             
          res.json('_id error');      
      } else {     
          var filterDelete = {_id: ObjectId(_id)}
          MongoClient.connect(CONNECTION_STRING, function(err, db) {
          db.collection(project).deleteOne(filterDelete, (err, docs) => {
            if (err) {
              res.json('_id error');
              db.close();              
              console.log(err)
            };                   
            if (docs.deletedCount === 0) {
              res.json('could not delete '+ _id);
            } else {
              res.json('deleted '+ _id);
            }                    
            db.close();
        });
       });
      }                
    }); 
};
