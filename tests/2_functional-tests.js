/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){
          assert.equal(res.status,200);
         assert.equal(res.body.symbol,'GOOG');
          //complete this one too
          
          done();
        });
      }); 
      
      test('1 stock with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock:'DON',like:true})
        .end((err,res)=>{
          assert.equal(res.status,200);
          assert.equal(res.body.symbol,'DON');
          done();
        })
        
      }); 
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock:'F',like:true, ip:['142.162.134.2','secondip','ivp6 ip']})
        .end((err,res)=>{
          assert.equal(res.status,200);
          assert.equal(res.text,'Already Liked!')
          done();
        })
      }); 
      
      test('2 stocks', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock:['F','GOOG']})
        .end((err,res)=>{
          let response = JSON.parse(res.text);
          assert.equal(res.status,200);
          assert.equal(response[0].stock,'F');
          assert.equal(response[1].stock,'GOOG');
          done();
        })
      }); 
      
      test('2 stocks with like', function(done) {
        chai.request(server)
        .get('/api/stock-prices')
        .query({stock:['F','GOOG'],like:true})
        .end((err,res)=>{
          assert.equal(res.status,200);
          assert.equal(res.text,'Already Liked F!');
          assert.equal(res.likes,undefined);
          done();
        })
      }); 
      
    });

});
