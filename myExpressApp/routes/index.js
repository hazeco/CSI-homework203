var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/information', (req,res,next) => {
  console.log('Get-Server Information called');
  const serverInfo = {
    hostname: req.hostname,
    platform: process.platform,
    architecture: process.arch,
    nodeVersion: process.version
  };
  res.send(serverInfo);
})

module.exports = router;
