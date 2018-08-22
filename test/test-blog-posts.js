'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
var should = require("chai").should();

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

//chai.should();

function seedBlogPostData() {
    console.info('loading blog post data');
    const seedData = [];
    for (let i = 1; i <= 10; i++) {
      seedData.push({
        author: {
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName()
        },
        title: faker.lorem.sentence(),
        content: faker.lorem.text()
      });
    }
   // console.log(seedData);  /// data is loaded
    // this will return a promise
    return BlogPost.insertMany(seedData);
    
  }
  
  
  describe('blog posts API resource', function () {  /// this part is working 
  
    before(function () {
      return runServer(TEST_DATABASE_URL);
    });
  
    beforeEach(function () {
      return seedBlogPostData();
    });
  
    afterEach(function () {
      // tear down database so we ensure no state from this test
      // effects any coming after.
      return tearDownDb();
    });
  
    after(function () {
      return closeServer();
    });
  

/// tear down DB working 
    function tearDownDb() {
        return new Promise((resolve, reject) => {
          console.warn('Deleting database');
          mongoose.connection.dropDatabase()
            .then(result => resolve(result))
            .catch(err => reject(err));
        });
      }



   // note the use of nested `describe` blocks.
  // this allows us to make clearer, more discrete tests that focus
  // on proving something small
  describe('GET endpoint', function () {

    it('should return all existing posts', function () {
      // strategy:
      //    1. get back all posts returned by by GET request to `/blogposts`
      //    2. prove res has right status, data type
      //    3. prove the number of posts we got back is equal to number
      //       in db.
      let res;
      return chai.request(app)
        .get('/posts')
        .then(_res => {
          res = _res;
          res.status.should.equal(200);
          // otherwise our db seeding didn't work
          res.body.should.have.lengthOf.at.least(1);
           //console.log("BLOG COUNT IS:", BlogPost.count())
          return BlogPost.count();
        })
        .then(count => {
          // the number of returned posts should be same
          // as number of posts in DB
         res.body.should.have.lengthOf(count);
        });
    });

    it('should return posts with right fields', function () {
      // Strategy: Get back all posts, and ensure they have expected keys

      let resPost;
      return chai.request(app)
        .get('/posts')
        .then(function (res) {

          res.status.should.equal(200);
          res.should.be.json;
          res.body.to.be.a('array');
          
          res.body.should.have.lengthOf.at.least(1);

            res.body.forEach(function (post) {
            post.should.be.a('object');
            post.should.include.keys('title', 'content', 'author');
          });
          // just check one of the posts that its values match with those in db
          // and we'll assume it's true for rest
          resPost = res.body[0];
          console.log("ID OF RETERNED OBJECT", resPost.id);
          return BlogPost.findById(resPost.id);
          //return BlogPost.findById(resPost);
        })
        .then(post => {
          resPost.title.should.equal(post.title);
          resPost.content.should.equal(post.content);
          resPost.author.should.equal(post.authorName);
        });
    });
  });

  })