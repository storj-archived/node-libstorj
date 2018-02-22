const mockbridge = require('./mockbridge.json');
const mockbridgeinfo = require('./mockbridgeinfo.json');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const basicauth = require('basic-auth');

app.use(bodyParser());
function forceStatus(req, res, next) {
  const statusRegex = /status-(\d{3})$/;
  const userAgent = req.headers['user-agent'];

  if (userAgent) {
    if (statusRegex.test(userAgent)) {
      status = parseInt(userAgent.match(statusRegex)[1], 10);
      return res.sendStatus(status);
    }
  }

  next();
}

function checkAuth(req, res, next) {
  const creds = basicauth(req);
  if (creds.name === 'testuser@storj.io' &&
      creds.pass === '83c2db176985cb39d2885b15dc3d2afc020bd886ffee10e954a5848429c03c6d') {
    return next();
  }

  res.sendStatus(401);

}

// GET
// TODO: figure out how to force status for endpoints that don't receive auth header
app.get('/', forceStatus, function(req, res) {
  res.status(200).json(mockbridgeinfo.info);
});

app.get('/buckets', forceStatus, checkAuth, function(req, res) {
  res.status(200).json(mockbridge.getbuckets);
});

app.get('/buckets/368be0816766b28fd5f43af5', forceStatus, checkAuth, function(req, res) {
  res.sendStatus(200);
});

app.get('/buckets/368be0816766b28fd5f43af5/files', forceStatus, checkAuth, function(req, res) {
  res.status(200).json(mockbridge.listfiles);
});

app.get('/bucket-ids/:name', forceStatus, checkAuth, function(req, res) {
  res.status(200).json(mockbridge.getbucketid);
});

app.get('/buckets/368be0816766b28fd5f43af5/files/998960317b6725a3f8080c2b/info', forceStatus, checkAuth, function(req, res) {
  res.status(200).json(mockbridge.getfileinfo);
});

app.get('/buckets/368be0816766b28fd5f43af5/file-ids/hTY5wsqYyLJQppCMiFQI7v2n/IZZiKb0ES1RCrUqK7Fe5m0/+fYwh+E/vp8M3FCEECle63BhlWlHi/Hj/Yg5y/bIjy8SxQ==', forceStatus, checkAuth, function(req, res) {
  res.sendStatus(404);
});

app.get('/buckets/368be0816766b28fd5f43af5/files/998960317b6725a3f8080c2b', forceStatus, checkAuth, function(req, res) {
  let skip = parseInt(req.query.skip);

  switch(skip) {
    case 0:
      res.status(200).json(mockbridge['getfilepointers-0']);
      break;
    case 3:
      res.status(200).json(mockbridge['getfilepointers-1']);
      break;
    case 6:
      res.status(200).json(mockbridge['getfilepointers-2']);
      break;
    case 9:
      res.status(200).json(mockbridge['getfilepointers-3']);
      break;
    case 12:
      res.status(200).json(mockbridge['getfilepointers-4']);
      break;
    case 15:
      res.status(200).json(mockbridge['getfilepointers-5']);
      break;
    case 4:
      res.status(200).json(mockbridge['getfilepointers-r']);
      break;
    case 14:
      res.status(200).json(mockbridge['getfilepointers-missing']);
      break;
    default:
      res.status(200).json([]);
  }
});

app.get('/frames', forceStatus, checkAuth, function(req, res) {
  res.status(200).json(mockbridge.getframes);
});

app.get('/frames/d4af71ab00e15b0c1a7b6ab2', forceStatus, checkAuth, function(req, res) {
    res.status(200).json(mockbridge.getframe);
});

app.get('/buckets/368be0816766b28fd5f43af5/files/998960317b6725a3f8080c2b/mirrors', forceStatus, checkAuth, function(req, res) {
  res.status(200).json(mockbridge.listmirrors);
});

// POST
app.post('/reports/exchanges', function(req, res) {
  // TODO check post body
  res.status(201).json({});
});

app.post('/buckets', forceStatus, checkAuth, function(req, res) {
  // TODO check post body
  let response = mockbridge.putbuckets;
  if (req.body.name) {
    response.name = req.body.name;
  }

  res.status(200).json(response);
});

app.post('/frames', forceStatus, checkAuth, function(req, res) {
  // TODO check post body
  res.status(200).json(mockbridge.createframe);
});

app.post('/buckets/368be0816766b28fd5f43af5/tokens', forceStatus, checkAuth, function(req, res) {
  // TODO check post body
  res.status(201).json(mockbridge.createbuckettoken);
});

app.post('/buckets/368be0816766b28fd5f43af5/files', forceStatus, checkAuth, function(req, res) {
  // TODO check post body
  res.status(201).json(mockbridge.createfile);
});

app.post('/users', forceStatus, function(req, res) {
  // TODO check post body
  res.status(201).json(mockbridge.createuser);
});

// PUT
app.put('/frames/d6367831f7f1b117ffdd0015', forceStatus, checkAuth, function(req, res) {
  // TODO check post body
  res.status(200).json(mockbridge.putframe);
});

// DELETE
app.delete('/buckets/368be0816766b28fd5f43af5', forceStatus, checkAuth, function(req, res) {
  // TODO check post body
  res.sendStatus(204);
});

app.delete('/buckets/368be0816766b28fd5f43af5/files/998960317b6725a3f8080c2b', forceStatus, checkAuth, function(req, res) {
  // TODO check post body
  res.sendStatus(200);
});

app.delete('/frames/d4af71ab00e15b0c1a7b6ab2', forceStatus, checkAuth, function(req, res) {
  // TODO check post body
  res.sendStatus(200);
});

module.exports = app;
