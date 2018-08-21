'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;

const {Blogposts} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);


// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo

function seedBlogpostsData() {
    console.info('seeding blogpast data');
    const seedData = [];
  
    for (let i=1; i<=10; i++) {
      seedData.push(generateBlogpostData());
    }
    // this will return a promise
    return Blogposts.insertMany(seedData);
  }

  // used to generate data to put in db
function generateTitlehName() {
    const titles = [
      'Manhattan', 'Queens', 'Brooklyn', 'Bronx', 'Staten Island'];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  // used to generate data to put in db
function generateContent() {
    const content = ['jlkjllkjlkjljljljljjljljljljjljljkj', 
    'kjkjdlkjsdljldjldjlsjklfjlkjdjflkjdlkjiieoajnoqinfiqeifnierfinuerifnireinsdlfk', 
    'Colombian'];
    return content[Math.floor(Math.random() * content.length)];
  }


  /*function generateAuthorName() {
    const Author = [{firstName: "Jack", lastName: "London"}, {firstName: "Rediard", lastName: "Kipling"}, {firstName: "Jonothan", lastName: "Swift"} ];
    return titles[Math.floor(Math.random() * titles.length)];
  }*/


// generate an object represnting a blogpsts.
// can be used to generate seed data for db
// or request.body data
function generateBlogpostData() {
  return {
    author: {
     firstName: faker.lorem.firstName(),
     lastName: faker.lorem.lastName()
    },
    titles: generateTitlehName(),
    content: generateContent(),
     
  };
}

// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure data from one test does not stick
// around for next one
function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
  }
  

  describe('Blogposts API resource', function() {

    // we need each of these hook functions to return a promise
    // otherwise we'd need to call a `done` callback. `runServer`,
    // `seedRestaurantData` and `tearDownDb` each return a promise,
    // so we return the value returned by these function calls.
    before(function() {
      return runServer(TEST_DATABASE_URL);
    });
  
    beforeEach(function() {
      return seedBlogpostData();
    });
  
    afterEach(function() {
      return tearDownDb();
    });
  
    after(function() {
      return closeServer();
    });

  })


   // note the use of nested `describe` blocks.
  // this allows us to make clearer, more discrete tests that focus
  // on proving something small
  describe('GET endpoint', function() {

    it('should return all existing blogposts', function() {
      // strategy:
      //    1. get back all blogpsts returned by by GET request to `/blogposts`
      //    2. prove res has right status, data type
      //    3. prove the number of blogposts we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/blogposts')
        .then(function(_res) {
          // so subsequent .then blocks can access response object
          res = _res;
          expect(res).to.have.status(200);
          // otherwise our db seeding didn't work
          expect(res.body.blogposts).to.have.lengthOf.at.least(1);
          return Blogposts.count();
        })
        .then(function(count) {
          expect(res.body.blogposts).to.have.lengthOf(count);
        });
    });


    it('should return blogposts with right fields', function() {
      // Strategy: Get back all blogposts, and ensure they have expected keys

      let resBlogposts;
      return chai.request(app)
        .get('/blogposts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.blogposts).to.be.a('array');
          expect(res.body.blogposts).to.have.lengthOf.at.least(1);

          res.body.blogposts.forEach(function(blogpast) {
            expect(blogpast).to.be.a('object');
            expect(blogpost).to.include.keys(
              'author', 'title', 'content');
          });
          resBlogposts = res.body.blogposts[0];
          return Blogposts.findById(resBlogposts.id);
        })
        .then(function(blogpost) {

          expect(resBlogposts.id).to.equal(blogpost.id);
          expect(resBlogposts.name).to.equal(blogpost.name);
          expect(resBlogposts.cuisine).to.equal(blogpost.cuisine);
          expect(resBlogposts.borough).to.equal(blogpost.borough);
          expect(resBlogposts.address).to.contain(blogpost.address.building);

          expect(resBlogposts.grade).to.equal(blogpost.grade);
        });
    });
  });