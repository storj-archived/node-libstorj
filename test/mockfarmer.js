const express = require('express');
const app = express();

const shards = [
  '179723620bfce52a6efaa6d311811cd9a31c51dc',
  '3920fcb1acf8d773bdff94edd293b57e1506073d',
  '76ec05cdfa1bc0810c5a555350d1e4cb81b01524',
  '4a9986ed3ec84a8a1b62b8ce9770002cf9aff02a',
  '76d9efb59a35a3c3862bbfb489ab1ed916f3f0d3',
  'a590ff71ca93662d63942fc2dcc2125cd592a4d4',
  'b6a676b696751baa9c04d82096a35107ca7f46b6',
  'b88b80d9f0942b90a86274b53e5ab3c8fae614de',
  '7afaf8bf5bbc6e0f69a4369db38d66c34caa47b5',
  'a51df80009ca689b9b05c84ec6511a1bfcbd53af',
  'a8f3fb43cc3a2ebbace4e435a49c4ddbc4c2e624',
  '04e21b32ffefb39c93023006148a6fcdd4fed66a',
  '0eb2a9961b3fd7752925af681784fbcb3483e211',
  'e3fabe31ef120978b8d95a1d6cc705f25086da52',
  '817de8fcdd64fb2adcb5f86bbdc2993879bf7c14',
  '9d5e980402a69e711b6176c268bbc059d7b5fb1f',
  'ec4a0f16ab581872ead75f6c6a681eb3c7861355',
  '7114c67d5d18884c51e5f2efd97803f95f7ddc18',
  '9354285b6750e5dff3fb6024f12826e8ab60007c',
  'eb342afde185b4f14477e9df81f85830cdd2cf12',
  '5dc5687381a7a09cdc98fe97cfcb1402ce8a1157',
  'a16fdcfe8b8acd2d2ba8a6889aaf74f1b13004bb',
  'db4af3d07dc90b0125cf465de4be1a10a478f9e4',
  'bf1e4713257129d525f1381d4104c217c13cb42f',

  // parity shards
  'a058c13bf955d1d6134ab37ad6210de9cf539668',
  'f08c086703e511d38b0529afe6cc64f35b40bf1f',
  'a549cec8729de18e021c72b6a17009e0381b7bc6',
  'e0a3e7539912f15c83893f368cfe55e7a0909fbb',
  '0ec6fe684d01530ed2311c9c13a77d63b1d668c5',
  'c012be824494db131425a765d9d0bb390cd7c3d0',
  '76d463057e1631644b7b4c89170496b6a5879965',
  'e2b4704e8a308c115e989781f33f8c29b931961b',
  '251dc66f81cc78c70afbd139042df66eb0d9336e',
  'd1e0c5f9f08ab1f293a4559273a8a119f791647a'
];

const retryShard = '1391bf1eb215941e84bd8c52201511041580918e';

app.get("/", function(req, res) {
  res.sendStatus(200);
});

let count = 0;
app.post('/shards/:hash', function(req, res) {
  if (req.params.hash === retryShard) {
    if (count == 0) {
      count += 1;
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  } else {
    if (shards.includes(req.params.hash)) {
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  }
});

module.exports = app;
