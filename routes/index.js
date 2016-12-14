var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('Home page')
  res.render('index', { title: 'Express' });
});



module.exports = router;
