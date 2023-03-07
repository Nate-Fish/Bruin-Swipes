function MessageForm(props) {
  const [message, setMessage] = React.useState("");
  const { handleSend } = props;

  const handleChange = (event) => {
    setMessage(event.target.value);
  };

  const handleClick = (event) => {
    if (message != '') {
        handleSend(message);
        setMessage('');
    }
  }

  return (
    <div className="message-input-area">
      <input
        type="text"
        value={message}
        onChange={handleChange}
        placeholder="Type a message..."
        className = "textbox"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            handleClick();
          }
        }}
      />
      <button 
      onClick={handleClick}
      className = "messages-button">Send</button>
    </div>
  );
}
function MessageList(props) {
  console.log("Entering MessageList")
  const { currentConversation } = props;
  console.log(currentConversation)
  return (
    <div>
      {currentConversation.messages.map(message => (
        <div key={message.id}>
          <p>{message.received ? currentConversation.name : "You"}: {message.text}</p>
        </div>
      ))}
    </div>
  );
}
function ChatHeader(props) {
  const { conversation } = props;

  return (
    <div>

      <h2><img src={conversation.avatar} alt="conversation avatar" className = "imageHeader" style={{"maxWidth" : "50px"}}/> {conversation.name} </h2>
    </div>
  );
}
function ConversationList(props) {
  console.log("Setting current conversations")
  const { conversations, setCurConversationIndex } = props;

  const handleClick = (index) => {
    setCurConversationIndex(index);
  }

  return (
    <div>
      {conversations.map((conversation, index) => (
        <div key={conversation.id} onClick={() => handleClick(index)} className="conversation">
          <img src={conversation.avatar} alt="conversation avatar" className="avatar" />
          <div className="conversation-details">
            <div className="preview-name">
              <h3>{conversation.name}</h3> </div>
            <p className="message">{conversation.messages[conversation.messages.length - 1].text.substring(0, 30)}...</p>
            <div className = "preview-time"> <p>{conversation.messages[conversation.messages.length - 1].time}</p> 
              </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [conversations, setConversations] = React.useState([
    {
      id: 1,
      name: "Bruin Bear",
      avatar: "https://art.pixilart.com/0ae85e84a5bdae3.png",
      messages: [
        {
          received: true,
          text: "Hey there cutie! Would you like to buy a swipe?",
          time: "10:30 AM",
        },
        {
          received: false,
          text: "Yes i want free swipes!",
          time: "10:31 AM",
        }
      ]
    },
    {
      id: 2,
      name: "Paul Eggy",
      avatar: "https://www.researchgate.net/profile/Alfonso-Padilla-Vivanco/publication/280672565/figure/fig4/AS:284547204829193@1444852748854/A-binary-input-image-size-40X40-px.png",
      messages: [
        {
          received: true,
          text: "gimme free swipes",
          time: "10:20 AM",
        },
        {
          received: false,
          text: "no i dont :)",
          time: "10:32 AM",
        }
      ]
    },
    {
        id: 3,
        name: "Swag",
        avatar: "https://pbs.twimg.com/media/D2Y5afjWsAYqL7u?format=png&name=360x360",
        messages: [
          {
            received: true,
            text: "I am interested in buying swipes",
            time: "10:50 AM",
          },
        ]
      }
  ]);
  let testing = {
    sender: 100,
    recipient: 101,
    read: false,
    text: "Hello World",
    time: 101240125 
  }
  const [curConversationIndex, setCurConversationIndex] = React.useState(null);
  const handleSend = (message) => {
    //get the time in AM/PM format
    const date = new Date();
    const showTime = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    const epochTime = Date.now();
    const newConversations = [...conversations];
    newConversations[curConversationIndex].messages.push({
      received: false,
      text: message,
      time: epochTime,
    });
    setConversations(newConversations);
    //sets the conversation to the top of the list when talked in
    if (conversations.index != 0) {
        let temp = conversations[curConversationIndex];
        let tempArray = [...conversations];
        tempArray.splice(curConversationIndex, 1);
        tempArray.unshift(temp);
        setConversations(tempArray);
        setCurConversationIndex(0);
    }
    // code to scroll to the bottom of the message list when a message is sent
  }
  const ophir = {
    sender: 101,
    recipient: 100,
    read: false,
    text: "Hello World",
    time: 101240125
  }

  return (
    //create a messages sidebar that says "Chats" above the list of conversations
      <div className="App">
      <div className="messages-sidebar">
        <ConversationList conversations={conversations} setCurConversationIndex={setCurConversationIndex} />
      </div>
      <div className="chat">
        {curConversationIndex !== null ? (
          <>
          {/* <h1 className = "messages-title">Chats</h1> */}
            <ChatHeader conversation={conversations[curConversationIndex]} />
            <MessageList className = "messageList" currentConversation={conversations[curConversationIndex]}/>
            <MessageForm handleSend={handleSend}/>
            <button onClick={() => makeRequest("/send-messages", testing)}>Send Message</button>
            <button onClick={() => makeRequest("/get-messages", ophir)}>Get Message</button>
          </>
        ) : (
          <div className="no-conversation">No conversation selected</div>
        )}
      </div>
    </div>
  );
}
const rootNode = document.getElementById('messages-root');
const root = ReactDOM.createRoot(rootNode);
root.render(React.createElement(App));
// export default App;