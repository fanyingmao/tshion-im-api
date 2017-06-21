'use strict';

const crypto = require('crypto');
module.exports = function(app) {
  return new AccountRemote(app);
};

var AccountRemote = function(app) {
  this.app = app;
  this.roomMap = new Map();
  this.Room = require('../../../models/room')(app);
  this.Account = require('../../../models/account')(app);
  this.channelService = app.get('channelService');
};

const prototype = AccountRemote.prototype;

prototype.login = function(token, cb) {
  // use when need
  console.log(this.app.get('hello'));
  this.app.rpc.tlifang.tlifangRemote.login(null, token, function(err, data) {
    if (err) return cb(err);
    cb(null, data);
  });
};


prototype.bindChannel = function(uid, cid, cb) {
  let self = this;
  self.app.onlineRedis.get(uid).then(lastcid => {
    if (lastcid && lastcid !== cid) {
      self.rpc.chat.chatRemote.kick(null, `${uid}*${lastcid}`, app.get('serverId'), null);
    }
    this.app.onlineRedis.set(uid, cid).then(status => {
      cb(null, status);
    }).catch(cb);
  });
};

prototype.unbindChannel = function(uid, cb) {
  this.app.onlineRedis.del(uid).then(status => {
    cb(null, status);
  }).catch(cb);
};

prototype.bindRoom = function({ uid, target, fcid, target_cid }, cb) {
  let self = this;
  let members = [uid, target].sort();
  const roomHash = crypto.createHash('sha1').update(members.join('*')).digest('hex');

  let roomInner = {
    [uid]: fcid,
    [target]: target_cid
  };
  new self.Room({ roomid: roomHash, members, room: roomInner }).save()
    .then(room =>
      self.Room.upgradeActive(room)
      .then(nextRoom => cb(null, nextRoom))
      .catch(cb))
    .catch(cb);
};

prototype.activeRoom = function(roomid, cb) {
  let self = this;
  self.Room.findRoom({ roomid }).then(room => {
    return self.Room.upgradeActive(room).then(nextRoom => cb(null, nextRoom));
  }).catch(cb);
};

prototype.unActiveRoom = function(roomid, cb) {
  let self = this;
  self.Room.unActive(roomid).then(result => cb(null, result)).catch(cb);
};

prototype.saveDeviceToken = function(info, cb) {
  let self = this;
  new self.Account(info).saveAccount().then(value => cb(null, value)).catch(cb);
};

prototype.getDeviceToken = function(info, cb) {
  let self = this;
  console.log(info);
  self.Account.getDeviceToken(info).then(tokens => cb(null, tokens)).catch(cb);
};

prototype.revokeDeviceToken = function(info, cb) {
  let self = this;
  self.Account.delDeviceToken(info).then(result => cb(null, result)).catch(cb);
};

prototype.findFriends = function(uid) {

};

prototype.express = function(a, b, cb) {
  console.log('reveive:', a, b);
  cb(null, { a, b });
};
