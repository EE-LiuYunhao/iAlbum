import React from 'react';
import './App.css';
import $ from 'jquery';


class AlbumPage extends React.Component
{
  constructor(props)
  {
    super(props);
    this.state = {
                  firstLoaded:true,
                  login:false,
                  username:"",
                  friends:[],
                  loginName:"",
                  loginPassword:"",
                  headerMessage:"",
                  images:[],
                  displayedUserIndex: 0,
                  selectedFile: null
                 };
    this.handlePageLoad = this.handlePageLoad.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleLogOut = this.handleLogOut.bind(this);
    this.handleMyAlbum = this.handleMyAlbum.bind(this);
    this.handleFriendsAlbum = this.handleFriendsAlbum.bind(this);
    this.handleUploadPhoto = this.handleUploadPhoto.bind(this);
    this.handleDeletePhoto = this.handleDeletePhoto.bind(this);
    this.handleLikeButton = this.handleLikeButton.bind(this);

    this.userNameOnClick = this.userNameOnClick.bind(this);
    this.passwordOnClick = this.passwordOnClick.bind(this);
    this.chooseFileHandler = this.chooseFileHandler.bind(this);
  }
  componentDidMount()
  {
    this.handlePageLoad();
  }

  //functions
  //AJAX for /init
  handlePageLoad()
  {
    if(this.state.firstLoaded)
    {
      $.ajax({
        type:'GET',
        dataType:'text',
        url:"http://localhost:3002/init",
        xhrFields: {withCredentials: true},
        success:function(data)
        {
          if(data==="")
          {
            this.setState({login:false});
          }
          else
          {
            var resultJSON = $.parseJSON(data);
            this.setState(
              {
                firstLoaded: false,
                username : resultJSON.username,
                friends : resultJSON.friends,
                headerMessage : "Hello "+resultJSON.username,
                login : true
              }
            );
          }
        }.bind(this),
        error:(err)=>alert(err)
      });
    }
  }
  //AJAX for /login
  handleLogin(event)
  {
    event.preventDefault(event);
    if(this.state.loginName===""||this.state.loginPassword==="")
    {
      alert("You must enter username and password");
    }
    else
    {
      $.ajax(
      {
        type:"POST",
        url:"http://localhost:3002/login",
        xhrFields: {withCredentials: true},
        dataType:"text",
        data:{'username':this.state.loginName,
              'password':this.state.loginPassword},
        success:function(data)
        {
          if(data==="Login failure")
          {
            this.setState({
              login:false,
              headerMessage : data
            });
          }
          else
          {
            var resultJSON = $.parseJSON(data);
            this.setState({
              username : resultJSON.username,
              friends : resultJSON.friends,
              headerMessage : "Hello "+resultJSON.username,
              login : true
            });
          }
        }.bind(this),
        error:(error)=>alert(error)
      });
    }
  }
  //AJAX for /logout
  handleLogOut()
  {
    $.ajax(
    {
      type:'GET',
      url:"http://localhost:3002/logout", 
      xhrFields: {withCredentials: true},
      success:function(data)
      {
        if(data==="")
        {
          this.setState(
            {
              firstLoaded:true,
              login:false,
              username:"",
              friends:[],
              loginName:"",
              loginPassword:"",
              headerMessage:"",
              images:[],
              displayedUserIndex: 0,
              selectedFile: null
            }
          );
        }
      }.bind(this),
      error:(e)=>alert(e)
    });
  }
  //AJAX for viewing self 
  handleMyAlbum()
  {
    this.setState({displayedUserIndex:0});
    $.ajax(
    {
      type:'GET',
      url:"http://localhost:3002/getalbum/0", 
      xhrFields: {withCredentials: true},
      success: function(data)
      {
        this.setState({images:$.parseJSON(data)});
      }.bind(this),
      error:(e)=>alert(e)
    });
  }
  //AJAX for viewing friends
  handleFriendsAlbum(clickedUserid)
  {
    var idx = 1;
    for(var eachFriend of this.state.friends)
    {
      if(eachFriend.userid===clickedUserid)
      {
        this.setState({displayedUserIndex:idx});
        break;
      }
      idx += 1;
    }
    $.ajax(
    {
      type:'GET',
      url:"http://localhost:3002/getalbum/"+clickedUserid,
      xhrFields: {withCredentials: true},
      success:function(data, status)
      {
        this.setState({images:$.parseJSON(data)});
      }.bind(this),
      error:(e)=>alert(e)
    });
  }
  //Handling reply for uploading photo
  //set this to be the uploadSuccess in the fileupload options
  handleUploadPhoto()
  {
    if(this.state.selectedFile===null)
    {
      alert("You haven't select any image");
    }
    else
    {
      $.ajax({
        type:'POST',
        url:'http://localhost:3002/uploadphoto',
        data:this.state.selectedFile,
        contentType:false,
        processData:false,
        dataType:'text',
        xhrFields: {withCredentials: true},
        success:function(data)
        {
          var allImages = this.state.images;
          allImages.push($.parseJSON(data));
          console.log("after appended: "+JSON.stringify(allImages));
          this.setState({
            images:allImages,
            selectedFile:null
          });
        }.bind(this),
        error:(error)=>alert(error)
      })
    }
  }
  //AJAX for delete photo
  handleDeletePhoto(photoid)
  {
    var confirmation = window.confirm('Are you sure you want to delete this contact?');
    if(confirmation===true)
    {
      $.ajax(
        {
          type: 'DELETE',
          url: "http://localhost:3002/deletephoto/"+photoid,
          xhrFields: {withCredentials: true},
          dataType: "text",
          cache:false,
          success: function(data)
          {
            if(data==="")
            {
              for(var eachImage of this.state.images)
              {
                if(eachImage._id===photoid)
                {
                  var allImages = this.state.images;
                  allImages.splice(allImages.indexOf(eachImage),1);
                  this.setState({images:allImages});
                  break;
                }
              }
            }
            else
            {
              alert(data);
            }
          }.bind(this),
          error: function (xhr, ajaxOptions, thrownError)
          {
            alert(xhr.status);
            alert(thrownError);
          }
        }
        );
      }
      //else: do nothing
  }
  //AJAX for like button
  handleLikeButton(photoid)
  {
    for(var eachImage of this.state.images)
    {
      var noNeedToUploadLike = false;
      if(eachImage._id===photoid)
      {
        if(eachImage.likedby.indexOf(this.state.username)>=0)
        {
          noNeedToUploadLike = true;
        }
        break;
      }
    }
    if(noNeedToUploadLike)
    {
      alert("You have liked this photo");
    }
    else
    {
      $.ajax(
      {
        type:'PUT',
        url:"http://localhost:3002/updatelike/"+photoid,
        xhrFields: {withCredentials: true},
        dataType:'text',
        cache:false,
        success:function(data)
        {
          var newLikedBy = $.parseJSON(data);
          var allImages = this.state.images;
          for(var eachImage of allImages)
          {
            if(eachImage._id === photoid)
            {
              eachImage.likedby = newLikedBy;
              break;
            }
          }
          this.setState({images:allImages});
        }.bind(this),
        error: function (xhr, ajaxOptions, thrownError)
        {
          alert(xhr.status);
          alert(thrownError);
        }
      });
    }
  }
  //handle username input
  userNameOnClick(event)
  {
    this.setState({loginName:event.target.value});
  }
  //handle password input
  passwordOnClick(event)
  {
    this.setState({loginPassword:event.target.value});
  }
  //handle file selection
  chooseFileHandler(event)
  {
    var file = event.target.files[0];
    console.log(file);
    this.setState({selectedFile:file});
  }
  render()
  {
    //condition login for header
    let loginLogout = null;
    if(this.state.login)
    {
      loginLogout = <button id="logout_btn" className="btn" onClick={this.handleLogOut}>Logout</button>;
    }
    else
    {
      loginLogout = (
        <form id="loginForm" className="horizontal_form">
          Username:
          <input className="input_text" type="text" placeholder="User name" 
                 value={this.state.loginName} onChange={this.userNameOnClick} />
          <input className="input_text" type="password" placeholder="Password"
                 value={this.state.loginPassword} onChange={this.passwordOnClick} />
          <input className="btn" type="submit" onClick={(e)=>this.handleLogin(e)}/>
        </form>
      );
    }
    //rows for sidebar
    let rows = [];
    if(this.state.login)
    {
      if(this.state.displayedUserIndex===0)
        rows.push(
          <div key='profile_0' className="profile_btn profile_selected" onClick={this.handleMyAlbum}>
            <p>MyAlbum</p>
          </div>
        );
        else
          rows.push(
            <div key='profile_0' className="profile_btn" onClick={this.handleMyAlbum}>
              <p>MyAlbum</p>
            </div>
          );
      var idx = 1;
      for(let eachFriend of this.state.friends)
      {
        if(this.state.displayedUserIndex===idx)
          rows.push(
            <div key={'profile_'+idx} className="profile_btn profile_selected" onClick={(e)=>this.handleFriendsAlbum(eachFriend.userid)}>
              <p>{eachFriend.username}</p>
            </div>
        );
        else
            rows.push(
              <div key={'profile_'+idx} className="profile_btn" onClick={(e)=>this.handleFriendsAlbum(eachFriend.userid)}>
                <p>{eachFriend.username}</p>
              </div>
          );
        idx++;
      }
    }
    //for image collection
    var imageCollection = null;
    if(this.state.login)
    {
      imageCollection = (
        <ImageCollection
          key={this.state.displayedUserIndex}
          images={this.state.images}
          displayedUserIndex={this.state.displayedUserIndex}
          handleDeletePhoto={this.handleDeletePhoto}
          handleLikeButton={this.handleLikeButton}
          handleUploadPhoto={this.handleLikeButton}
          chooseFileHandler={this.chooseFileHandler}
          uploadFileHandler={this.handleUploadPhoto}
        />
      )
    }
    return(
      <div id="root" onLoad={this.handlePageLoad}>
        <div id="header">
          <h1>iAlbum</h1>
          <p>{this.state.headerMessage}</p>
          {loginLogout}
          <div id="place_holder"></div>
        </div>
        <div id="sidebar_wrapper">
          {rows}
        </div>
        <div id="image_collection_wrapper">
          {imageCollection}
        </div>
      </div>
    );
  }
}

class ImageCollection extends React.Component
{
  constructor(props)
  {
    super(props);
    this.handleDeletePhoto = this.handleDeletePhoto.bind(this);
    this.handleLikeButton = this.handleLikeButton.bind(this);
    this.handleUploadPhoto = this.handleUploadPhoto.bind(this);
    this.chooseFileHandler = this.chooseFileHandler.bind(this);
    this.uploadFileHandler = this.uploadFileHandler.bind(this);
    this.handleImageClick = this.handleImageClick.bind(this);
    this.handleBackwardArrow = this.handleBackwardArrow.bind(this);
    this.state={
                singleImageMode:false,
                idxSingleImage:0
               }
  }
  handleImageClick(photoIdx)
  {
    this.setState({
                    singleImageMode:true,
                    idxSingleImage:photoIdx
                  });
  }
  handleBackwardArrow()
  {
    this.setState({singleImageMode:false})
  }
  handleDeletePhoto(photoid)
  {
    this.setState({singleImageMode:false});
    this.props.handleDeletePhoto(photoid);
  }
  handleLikeButton(photoid)
  {
    this.props.handleLikeButton(photoid);
  }
  handleUploadPhoto(successMessage)
  {
    this.setState({singleImageMode:false});
    this.props.handleUploadPhoto(successMessage);
  }
  uploadError(err)
  {
    alert(err);
  }
  chooseFileHandler(event)
  {
    this.props.chooseFileHandler(event);
  }
  uploadFileHandler()
  {
    this.setState({singleImageMode:false});
    this.props.uploadFileHandler();
  }

  render()
  {
    var imageItemList = [];
    if(this.state.singleImageMode)
    {
      const thisImage = this.props.images[this.state.idxSingleImage];
      imageItemList.push(
        <ImageItem
          imageIdx={this.state.idxSingleImage}
          singleImageMode={this.state.singleImageMode}
          displayedUserIndex={this.props.displayedUserIndex}
          imageId={thisImage._id}
          imageUrl={thisImage.url}
          likedby={thisImage.likedby}
          handleDeletePhoto={this.handleDeletePhoto}
          handleLikeButton={this.handleLikeButton}
          handleImageClick={this.handleImageClick}
        />
      );
    }
    else
    {
      let imgIdx=0;
      for(let eachImage of this.props.images)
      {
        imageItemList.push(
          <ImageItem
            imageIdx={imgIdx}
            singleImageMode={this.state.singleImageMode}
            displayedUserIndex={this.props.displayedUserIndex}
            imageId={eachImage._id}
            imageUrl={eachImage.url}
            likedby={eachImage.likedby}
            handleDeletePhoto={this.handleDeletePhoto}
            handleLikeButton={this.handleLikeButton}
            handleImageClick={this.handleImageClick}
          />
        );
        imgIdx++;
      }
    }
    var uploadBar = null;
    if(this.props.displayedUserIndex===0 && ! this.state.singleImageMode)
    {
      //render the upload bar
      uploadBar = (
        <div id='upload_bar' className='horizontal_form'>
          <form method="post" action="upload_file_form" id='upload_file_form'>
            <label>Upload your image</label>
            <input type='file' name='file' className="file_name_content"
                   onChange={(e)=>this.chooseFileHandler(e)}/>
            <button type='button' id='upload_button' className='btn'
                    onClick={this.uploadFileHandler}>
              Upload file
            </button>
          </form>
        </div>
      )
    }
    var backwardArrow=null;
    if(this.state.singleImageMode)
    {
      backwardArrow=(
                      <div id="backwardArrow">
                        <a className="btn" onClick={this.handleBackwardArrow}>
                          X
                        </a>
                      </div>
                    )
    }
    return(
      <div id="image_collection">
        {backwardArrow}
        {imageItemList}
        {uploadBar}
      </div>
    );
  }
}
class ImageItem extends React.Component
{
  constructor(props)
  {
    super(props);
    this.handleDeletePhoto = this.handleDeletePhoto.bind(this);
    this.handleLikeButton = this.handleLikeButton.bind(this);
    this.handleImageClick = this.handleImageClick.bind(this);
  }
  handleImageClick()
  {
    if(!this.props.singleImageMode)
      this.props.handleImageClick(this.props.imageIdx);
  }
  handleDeletePhoto(event, photoid)
  {
    event.preventDefault();
    this.props.handleDeletePhoto(photoid);
  }
  handleLikeButton(event, photoid)
  {
    event.preventDefault();
    this.props.handleLikeButton(photoid);
  }
  render()
  {
    var likedByText = "";
    if(this.props.likedby.length!==0)
    {
      for(var eachFriend of this.props.likedby)
      {
        likedByText = likedByText+eachFriend;
        likedByText = likedByText+",";
      }
      likedByText = likedByText.substring(0,likedByText.length-1);
      likedByText = likedByText+" liked this photo";
    }
    var button = null;
    if(this.props.displayedUserIndex===0)
    {
      button = (
        <button className="btn" onClick={(e)=>this.handleDeletePhoto(e,this.props.imageId)}>
          Delete
        </button>
      );
    }
    else
    {
      button = (
        <button className="btn" onClick={(e)=>this.handleLikeButton(e,this.props.imageId)}>
          Like
        </button>
      );
    }
    var imageComponent = null;
    if(!this.props.singleImageMode)
     imageComponent = <img width="80%" src={this.props.imageUrl} alt="" onClick={this.handleImageClick}/>
    else
      imageComponent= <img src={this.props.imageUrl} alt="" onClick={this.handleImageClick}/>
    return(
      <div id={this.props.imageId} className="image_item">
        {imageComponent}
        <br/>
        <p>{likedByText}</p>
        {button}
      </div>
    );
  }
}

export default AlbumPage;
