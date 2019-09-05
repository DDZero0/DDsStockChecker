/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';
let bodyParser = require('body-parser');
var expect = require('chai').expect;
var MongoClient = require('mongodb');
let request = require('request');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});
const apiKey = process.env.API_KEY;

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
    
    let ip = getIP(req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    let symbol = getSingleOrDual(req.query.stock);
    let like = req.query.like;
    let likeCount1 =0;
    let likeCount2 =0;
    let stockData = {};
    let URL = `https://www.alphavantage.co/query?function=BATCH_STOCK_QUOTES&symbols=${symbol}&apikey=${apiKey}`;
    
   request({
      url:URL,
      json:true,
    }, (err,request,response)=>{
      if (err) throw err;
     let stock2;
     let price2;
     let stock1 = response['Stock Quotes'][0]['1. symbol'];
     let price1 = response['Stock Quotes'][0]['2. price'];
     
     if(response['Stock Quotes'][1]){
     stock2 = response['Stock Quotes'][1]['1. symbol'];
     price2 = response['Stock Quotes'][1]['2. price'];
     }
     
    if(stock2 == undefined){ 
     MongoClient.connect(CONNECTION_STRING,{useNewUrlParser: true, useUnifiedTopology: true},(err,data)=>{
      if (err) throw err;
      let db = data.db('Stocks');
     
      if(like){
      db.collection('Stock-Likes').findOne({stock:symbol,ip:{$nin:[ip]}},(err,doc)=>{
        if (err) throw err; 
       if (doc==null){
         return res.send('Already Liked!');
       }
        else{
      db.collection('Stock-Likes').findOneAndUpdate({stock: symbol},{$inc:{likes:1}},{returnNewDocument:true, upsert:true, new:true},(err,doc)=>{
        if (err) throw err;
        if(doc.value == null){
            doc.value ={likes:0}
          }
        
      likeCount1 = doc.value.likes;
      stockData.symbol = stock1;
      stockData.currentPrice = price1;
      stockData.likes = likeCount1;
      res.json(stockData);
      })
       }
        })
      }
       
      else{
        db.collection('Stock-Likes').findOneAndUpdate({stock: symbol},{$set:{stock:symbol}},{returnNewDocument:true, upsert:true, new:true},(err,doc)=>{
        if (err) throw err;
          if(doc.value == null){
            doc.value ={likes:0}
          }
        likeCount1 = doc.value.likes; 
        stockData.symbol = stock1;
        stockData.currentPrice = price1;
        stockData.likes = likeCount1;
      res.json(stockData);
      });
      }     
    });
    }
    
     else{
      if(!like){
       MongoClient.connect(CONNECTION_STRING,{useNewUrlParser: true, useUnifiedTopology: true},(err,data)=>{
      if (err) throw err;
      let db = data.db('Stocks');
     
      db.collection('Stock-Likes').findOne({stock:stock1},(err,doc)=>{
         if(doc == null){
            doc ={likes:0}
          }
        likeCount1 = doc.likes;
        
      db.collection('Stock-Likes').findOne({stock:stock2},(err,doc)=>{
        if(doc== null){
            doc ={likes:0}; 
          }
        likeCount2 = doc.likes;
        let stock = [];
        stock.push({stock:stock1,price:price1,rel_likes:likeCount1-likeCount2});
        stock.push({stock:stock2,price:price2,rel_likes:likeCount2-likeCount1});     
        res.json(stock);
      })
      })
       })
      }
       
       else{
         MongoClient.connect(CONNECTION_STRING,{useNewUrlParser: true, useUnifiedTopology: true},(err,data)=>{
           if (err) throw err;
           let db = data.db('Stocks');
           db.collection('Stock-Likes').findOne({stock:stock1,ip:{$nin:[ip]}},(err,doc)=>{
             if(err) throw err;
             if(doc == null){
              res.send('Already Liked '+stock1+'!');
               return;
             }
           })
           db.collection('Stock-Likes').findOne({stock:stock2,ip:{$nin:[ip]}},(err,doc)=>{
             if (err) throw err;
            if(doc == null){
               res.send('Already Liked '+stock2+'!');
               return; 
             }
            else{ 
           db.collection('Stock-Likes').findOneAndUpdate({stock:stock1},{$inc:{likes:1}},(err,doc)=>{
             if (err) throw err;
            if(doc.value == null){
              doc.value = {likes:0}
            }
             likeCount1 = doc.value.likes;
             db.collection('Stock-Likes').findOneAndUpdate({stock:stock1},{$push:{ip:ip}},(err,doc)=>{
               if (err) throw err;
             })
             db.collection('Stock-Likes').findOneAndUpdate({stock:stock2},{$inc:{likes:1}},(err,doc)=>{
               if (err) throw err;
               if(doc.value == null){
                 doc.value = {likes:0}
               }
               likeCount2 = doc.value.likes;
               db.collection('Stock-Likes').findOneAndUpdate({stock:stock2},{$push:{ip:ip}},(err,doc)=>{
               if (err) throw err;
             })
              let stock = [];
        stock.push({stock:stock1,price:price1,rel_likes:likeCount1-likeCount2});
        stock.push({stock:stock2,price:price2,rel_likes:likeCount2-likeCount1});
        
        res.json(stock);
             })
           })
            }
         })
           })
       }   
 }
    });
     });
  
const getIP = (ipinfo)=>{
  ipinfo = ipinfo.split(',');
 return ipinfo[0];
}
const getSingleOrDual = (str)=>{
     if(typeof str == 'string'){
      return str.toUpperCase();
    }
    else{
      str[0] = str[0].toUpperCase();
      str[1] = str[1].toUpperCase();
      return str;
    }
}
};
