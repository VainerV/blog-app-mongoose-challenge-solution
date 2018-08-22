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



   
  describe('GET endpoint', function () {

    it('should return all existing posts', function () {
      
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
          
         res.body.should.have.lengthOf(count);
        });
    });

    it('should return posts with right fields', function () {
      

      let resPost;
      return chai.request(app)
        .get('/posts')
        .then(function (res) {

          res.status.should.equal(200);
          res.should.be.json;
          res.body.should.be.a('array');
          
          res.body.should.have.lengthOf.at.least(1);

            res.body.forEach(function (post) {
            post.should.be.a('object');
            post.should.include.keys('title', 'content', 'author');
          });
          
          resPost = res.body[0];
          console.log("ID OF RETERNED OBJECT", resPost.id);
          return BlogPost.findById(resPost.id);
          
        })
        .then(post => {
          resPost.title.should.equal(post.title);
          resPost.content.should.equal(post.content);
          resPost.author.should.equal(post.authorName);
        });
    });
  });


  describe('POST endpoint', function () {
    
    it('should add a new blog post', function () {

      const newPost = {
        title: faker.lorem.sentence(),
        author: {
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
        },
        content: faker.lorem.text()
      };

      return chai.request(app)
        .post('/posts')
        .send(newPost)
        .then(function (res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'id', 'title', 'content', 'author', 'created');
          res.body.title.should.equal(newPost.title);
          // cause Mongo should have created id on insertion
          res.body.id.should.not.be.null;
          res.body.author.should.equal(
            `${newPost.author.firstName} ${newPost.author.lastName}`);
          res.body.content.should.equal(newPost.content);
          return BlogPost.findById(res.body.id);
        })
        .then(function (post) {
          post.title.should.equal(newPost.title);
          post.content.should.equal(newPost.content);
          post.author.firstName.should.equal(newPost.author.firstName);
          post.author.lastName.should.equal(newPost.author.lastName);
        });
    });
  });


  describe('PUT endpoint', function () {

    it('should update fields you send over', function () {
      const updateData = {
        title: 'Oregon trails ',
        content: 'kjskfsj skdjlfkjd kjsdlfj dhsdfkjhf ksjdlfjdl',
        author: {
          firstName: 'Jack',
          lastName: 'London'
        }
      };

      return BlogPost
        .findOne()
        .then(post => {
          updateData.id = post.id;

          return chai.request(app)
            .put(`/posts/${post.id}`)
            .send(updateData);
        })
        .then(res => {
          res.should.have.status(204);
          return BlogPost.findById(updateData.id);
        })
        .then(post => {
          post.title.should.equal(updateData.title);
          post.content.should.equal(updateData.content);
          post.author.firstName.should.equal(updateData.author.firstName);
          post.author.lastName.should.equal(updateData.author.lastName);
        });
    });
  });




  describe('DELETE endpoint', function() {
    
    it('delete a blog by id', function() {

      let blogpost;

      return BlogPost
        .findOne()
        .then(function(_blogpost) {
          blogpost = _blogpost;
          return chai.request(app).delete(`/posts/${blogpost.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(blogpost.id);
        })
        .then(function(_blogpost) {
          expect(_blogpost).to.be.null;   //// should.not.exist(bpost)
         
        });
       
    });
    
  });

})