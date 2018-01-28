// create a new instance of ChatEngine
ChatEngine = ChatEngineCore.create({
    publishKey: 'YOUR-PUBLISH-KEY',
    subscribeKey: 'YOUR-SUBSCRIBE-KEY'
});
// use a helper function to generate a new profile
let newPerson = generatePerson(true);

// create a bucket to store our ChatEngine Chat object
let myChat;

// create a bucket to store 
let me;

UPLOADCARE_LOCALE = "en";
UPLOADCARE_TABS = "file url facebook gdrive dropbox instagram evernote flickr skydrive";
UPLOADCARE_PUBLIC_KEY = "YOUR-UPLOADCARE-KEY";

// get some references to our UI elements
const input = $('#message-to-send');
const widget = uploadcare.Widget('[role=uploadcare-uploader]');
const file = $('#output')

// compile handlebars templates and store them for use later
let peopleTemplate = Handlebars.compile($("#person-template").html());
let meTemplate = Handlebars.compile($("#message-template").html());
let userTemplate = Handlebars.compile($("#message-response-template").html());

// this is our main function that starts our chat app
const init = () => {
  
  // connect to ChatEngine with our generated user
  ChatEngine.connect(newPerson.uuid, newPerson);

  // when ChatEngine is booted, it returns your new User as `data.me`
  ChatEngine.on('$.ready', function(data) {

      // store my new user as `me`
      me = data.me;

      // create a new ChatEngine Chat
      myChat = new ChatEngine.Chat('chatengine-demo-uploadcare');

      myChat.plugin(ChatEngineCore.plugin['chat-engine-uploadcare']());
      myChat.uploadcare.bind(widget);
      myChat.on('$uploadcare.upload', (payload) => {
        let text = `<img src="${payload.data.cdnUrl}" style="width: 350px;"/>`
        $('#output').append(text)
      });

      // when we recieve messages in this chat, render them
      myChat.on('message', (message) => {
          renderMessage(message);
      });

      // when a user comes online, render them in the online list
      myChat.on('$.online.*', (data) => {   
        $('#people-list ul').append(peopleTemplate(data.user));
      });

      // when a user goes offline, remove them from the online list
      myChat.on('$.offline.*', (data) => {
        $('#people-list ul').find('#' + data.user.uuid).remove();
      });

      // wait for our chat to be connected to the internet
      myChat.on('$.connected', () => {

          // search for 50 old `message` events
          myChat.search({
            event: 'message',
            limit: 50
          }).on('message', (data) => {
            
            console.log(data)
            
            // when messages are returned, render them like normal messages
            renderMessage(data, true);
            
          });
        
      });

      // bind our "send" button and return key to send message
      $('#sendMessage').on('submit', sendMessage)

  });

};

// send a message to the Chat
const sendMessage = () => {

    // get the message text from the text input
    let message = $('#message-to-send').val().trim();
    let finalMessage

    if (file.is(':empty')){
        finalMessage = message
    } else {
        finalMessage = file.html() + '<br>' + message
    }
  
    // if the message isn't empty
    if (message.length) {
      
        // emit the `message` event to everyone in the Chat
        myChat.emit('message', {
            text: finalMessage
        });

        // clear out the text input
        $('#message-to-send').val('');
        file.html('');
    }
    
    // stop form submit from bubbling
    return false;
  
};

// render messages in the list
const renderMessage = (message, isHistory = false) => {

    // use the generic user template by default
    let template = userTemplate;

    // if I happened to send the message, use the special template for myself
    if (message.sender.uuid == me.uuid) {
        template = meTemplate;
    }

    let el = template({
        messageOutput: message.data.text,
        time: getCurrentTime(),
        user: message.sender.state
    });
  
    // render the message
    if(isHistory) {
      $('.chat-history ul').prepend(el); 
    } else {
      $('.chat-history ul').append(el); 
    }
  
    // scroll to the bottom of the chat
    scrollToBottom();

};

// scroll to the bottom of the window
const scrollToBottom = () => {
    $('.chat-history').scrollTop($('.chat-history')[0].scrollHeight);
};

// get the current time in a nice format
const getCurrentTime = () => {
    return new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
};

// boot the app
init();