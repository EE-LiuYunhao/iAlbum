var express = require('express');
const fs = require('fs');
var pathTool = require('path');
var cors = require('cors');
var cookieParser = require('cookie-parser');
var albums = express.Router();

albums.use(cookieParser());
var corsOptions = {
	origin:'http://localhost:3000',
	credentials:true
}
albums.options('/*',cors(corsOptions));

albums.get('/init', cors(corsOptions), function(req, res)
{
    var db = req.db;
    var userList = db.get('userList');
    var retStr = "";
    if(req.cookies.userID)
    {
        userList.find({_id:req.cookies.userID},{},function(err,result)
        {
            console.log("\t[DEBUG] http://localhost:3002/init => "+JSON.stringify(result));
            if(err === null)
            {
                //store the user name
                var userInfo = 
                {
                    'username':result[0].username,
                    'friends':[]
                };
                //retrieve the friends info and store them
                var numFriend = 0;
                for(var friendName of result[0].friends)
                {
                    userList.find({username:friendName},{}, function(err,docs)
                    {
                        if(err === null && docs != null)
                        {
                            userInfo.friends.push({'userid':docs[0]._id,'username':docs[0].username});
                        }
                        //else: skip the friend
                        numFriend += 1;
                        if(numFriend == result[0].friends.length)
                        {
                            console.log("[GET] http://localhost:3002/init => "+JSON.stringify(userInfo));
                            res.send(JSON.stringify(userInfo));
                        }
                    });
                }
            }
            else
            {
                res.send(err);
            }
        });
    }
    else
    {
        console.log("\t[DEBUG] http://localhost:3002/init => no user cookie");
        console.log("[GET] http://localhost:3002/init => "+retStr);
        res.send(retStr);
    }
});

albums.post('/login', cors(corsOptions), function(req,res)
{
    var trailUserName = req.body.username;
    var trailPassword = req.body.password;
    var db = req.db;
    var userList = db.get('userList');
    var retStr = "Login failure";
    
    userList.find({username:trailUserName,password:trailPassword},{},function(err, result)
    {
        var numFriend = 0;
        console.log("\t[DEBUG] http://localhost:3002/login {"+trailUserName+":"+trailPassword+"} => "+JSON.stringify(result));
        if(err === null && result != null && result.length >= 1)
        {
            //set a cookie based on result[0]._id
            var millionSeconds = 60*60*1000;
            res.cookie('userID',result[0]._id,{maxAge:millionSeconds});
            //send all the friends' username and _id back as JSON string
            var loginSuccess = {
                "username":result[0].username,
                "friends":[]
            };
            if(result.friends===null || result[0].friends.length===0)
            {
                retStr = JSON.stringify(loginSuccess);
                console.log("[POST] http://localhost:3002/login {"+trailUserName+":"+trailPassword+"} => "+retStr);
                res.send(retStr);
            }
            else
            {
                for(var friendName of result[0].friends)
                {
                    userList.find({username:friendName},{}, function(err,docs)
                    {
                        console.log("\t[DEBUG] http://localhost:3002/login {"+trailUserName+":"+trailPassword+"} => Friends:"+friendName+"?>"+JSON.stringify(docs));
                        if(err === null && docs.length>0)
                        {
                            loginSuccess.friends.push({'userid':docs[0]._id,'username':docs[0].username});
                        }
                        //else: skip the friend
                        numFriend += 1 ;
                        if(numFriend==result[0].friends.length)//this is the last friend
                        {
                            retStr = JSON.stringify(loginSuccess);
                            console.log("[POST] http://localhost:3002/login {"+trailUserName+":"+trailPassword+"} => "+retStr);
                            res.send(retStr);
                        }
                    });
                }
            }
        }
        else
        {
            if(err !== null)
            {
                retStr = err;
            }
            console.log("[POST] http://localhost:3002/login {"+trailUserName+":"+trailPassword+"} => "+retStr);
            res.send(retStr);
        }
    });
    
});

albums.get('/logout', cors(corsOptions), function(req,res)
{
    res.clearCookie('userID');
    console.log("[GET] http://localhost:3002/logout => \"\"");
    res.send("");
});

albums.get('/getalbum/:userid', cors(corsOptions), function(req,res)
{
    console.log("\t[DEBUG] http://localhost:3002/getalbum/"+req.params.userid+" => Cookie:{userID:"+req.cookies.userID+"}");
    var db = req.db;
    var photoList = db.get('photoList');
    
    if(req.params.userid==0)
    {
        //array for all of the current user
        photoList.find({userid:req.cookies.userID},{},function(err, docs)
        {
            console.log("\t[DEBUG] http://localhost:3002/getalbum/{"+req.cookies.userID+"} => "+JSON.stringify(docs));
            if(err === null)
            {
                console.log("[GET] http://localhost:3002/getalbum/{"+req.cookies.userID+"} => "+JSON.stringify(docs));
                res.send(JSON.stringify(docs));
            }
            else
            {
                console.log("[GET] http://localhost:3002/getalbum/{"+req.cookies.userID+"} => "+err);
                res.send(err);
            }
        });
    }
    else
    {
        //array for all of the specified user
        photoList.find({userid:req.params.userid},{},function(err, docs)
        {
            console.log("\t[DEBUG] http://localhost:3002/getalbum/"+req.params.userid+" => "+JSON.stringify(docs));
            if(err === null)
            {
                console.log("[GET] http://localhost:3002/getalbum/{"+req.params.userid+"} => "+JSON.stringify(docs));
                res.send(JSON.stringify(docs));
            }
            else
            {
                console.log("[GET] http://localhost:3002/getalbum/{"+req.params.userid+"} => "+err);
                res.send(err);
            }
        });
    }
});

albums.post('/uploadphoto', cors(corsOptions), function(req,res)
{
    var uploadedDateTime = new Date().getTime();
    var path = pathTool.join(__dirname, '../public/uploads/'+uploadedDateTime+'.jpg');
    console.log("\t[DEBUG] http://localhost:3002/uploadphoto/ => "+path+".jpg");
    req.pipe(fs.createWriteStream(path));
    //then, store entry in DB
    var db = req.db;
    var photoList = db.get('photoList');

    var newImage = {
        'url':'http://localhost:3002/uploads/'+uploadedDateTime+'.jpg',
        'userid':req.cookies.userID,
        'likedby':[]
    };
    
    photoList.insert(newImage);
    photoList.find({url:newImage.url},{},function(err, docs)
    {
        if(err===null)
        {
            console.log("[POST] http://localhost:3002/uploadphoto => "+JSON.stringify(docs[0]));
            res.send(JSON.stringify(docs[0]));
        }
        else
        {
            console.log("[POST] http://localhost:3002/uploadphoto => "+err);
            res.send(err);
        }
    });
});
    
albums.delete('/deletephoto/:photoid', cors(corsOptions), function(req,res)
{
    var db = req.db;
    var photoList = db.get("photoList");
    var photoName;
    photoList.find({_id:req.params.photoid},{}, function(err, result)
    {
        console.log("\t[DEBUG] http://localhost:3002/deletephoto/"+req.params.photoid+" => "+JSON.stringify(result));
        var pathes = result[0].url.split('/');
        if(pathes.length>=1)
        {
            photoName = pathes[pathes.length-1];
            fs.unlink(pathTool.join(__dirname,'../public/uploads/'+photoName), (err)=>
            {
                if(err)
                {
                    console.log("[DELETE] http://localhost:3002/deletephoto/"+req.params.photoid+" => "+err);
                    res.send(err);
                }
                else
                {
                    photoList.remove({_id:req.params.photoid});
                    console.log("[DELETE] http://localhost:3002/deletephoto/"+req.params.photoid+" => "+photoName+" was deleted");
                    res.send("");
                }
            });
        }
        else
        {
            console.log("[DELETE] http://localhost:3002/deletephoto/"+req.params.photoid+" =>  No such photo");
            res.send("No such photo");
        }
    });
});

albums.put('/updatelike/:photoid',cors(corsOptions), function(req,res)
{
    var db = req.db;
    var userList = db.get('userList');
    var photoList = db.get('photoList');
    var userid = req.cookies.userID;
    var username = null;
    var prevLikedBy = null;
    
    userList.find({_id:userid},{}, function(err, docs)
    {
        console.log("\t[DEBUG] http://localhost:3002/updatelike/"+req.params.photoid+" => user:"+JSON.stringify(docs));
        if(err===null && docs.length>=1)
        {
            username = docs[0].username;
            photoList.find({_id:req.params.photoid},{}, function(err, docs1)
            {
                console.log("\t[DEBUG] http://localhost:3002/updatelike/"+req.params.photoid+" => photo:"+JSON.stringify(docs1));
                if(err===null && docs1.length>=1)
                {
                    prevLikedBy = docs1[0].likedby;
                    prevLikedBy.push(username);
                    photoList.update({_id:req.params.photoid},{$set:{likedby:prevLikedBy}});
                    console.log("[PUT] http://localhost:3002/updatelike/"+req.params.photoid+" => "+JSON.stringify(prevLikedBy));
                    res.send(JSON.stringify(prevLikedBy));
                }
                else
                {
                    console.log("[PUT] http://localhost:3002/updatelike/"+req.params.photoid+" => "+err===null?"Photo unfound. ":err);
                    res.send(err===null?"Photo unfound. ":err);
                }
            });
        }
        else
        {
            console.log("[PUT] http://localhost:3002/updatelike/"+req.params.photoid+" => "+err===null?"User unfound. ":err);
            res.send(err===null?"User unfound. ":err);
        }
    });
});

module.exports = albums;
