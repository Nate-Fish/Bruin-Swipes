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
  const { currentConversation } = props;
  const currentUser = signed.email;
  let prevSender = null;

  return (
    <div className="message-list">
      {currentConversation.messages.map((message, index) => { 
        const currentSender = message.sender === currentUser ? "" : profiles[message.sender].name;
        const showSender = message.sender !== prevSender;
        prevSender = message.sender;
        return (
          <div key={index} className={message.sender === currentUser ? "message-right" : "message-left"}>
            {showSender && <div className="message-sender">{currentSender}</div>}
            <div className={`message-text ${message.sender === currentUser ? "message-right-text" : "message-left-text"}`}>
              {message.text}
              <span className="message-time" title={new Date(message.time).toLocaleString()}>{new Date(message.time).toLocaleTimeString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChatHeader(props) {
  const { conversation } = props;
  // TODO add link to profile page using email
  let link = "profile.html?email=" + conversation.email;
  return (
    <div className = "image-header">
      <h2><img src={conversation.avatar} alt="conversation avatar" style = {{"maxWidth" : "50px", "maxHeight": "50px", "borderRadius" : "25%"}} /> 
      <a className="profile-link" href= {link} >{'\t' + conversation.name}</a> 
      </h2>
    </div>
  );
}
function ConversationList(props) {
  const { conversations, setCurConversationIndex } = props;
  function epochToPST(epochTime) {
    const date = new Date(epochTime);
    return date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: 'numeric', hour12: true });
  }
  const handleClick = (index) => {
    if (index != globalConversationIndex) {
      difference = true;
    }
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
            <p className="message">
    {conversation.messages[conversation.messages.length - 1].text.length > 30
      ? `${conversation.messages[conversation.messages.length - 1].text.substring(0, 30)}...`
      : conversation.messages[conversation.messages.length - 1].text
    }
  </p>
            <div className = "preview-time"> 
            <p>{epochToPST(conversation.messages[conversation.messages.length - 1].time)}</p> 
              </div>
          </div>
        </div>
      ))}
    </div>
  );
}
// DEFINING GLOBAL VARIABLES
/**
 * Dictionary mapping emails to profile objects.
 */
let profiles = {};
/**
 * Array of global conversation objects.
 */
let globalConversations = [];
let signed;
let render;
let globalConversationIndex = null;
let oldGlobalConversationIndex = 0;
let amountRenders = 0; 
let difference = false;

function firstRender() {
  if (difference) {
    setTimeout(() => document.getElementsByClassName("chat")[0].scrollTo(999999,999999), 200); 
  }
}

function App() {
  const [conversations, setConversations] = React.useState(globalConversations);
  const [curConversationIndex, setCurConversationIndex] = React.useState(0);
  globalConversationIndex = curConversationIndex;
  render = setConversations;
  const handleSend = async (message) => {
    const newConversations = [...conversations];
    await makeRequest("/send-messages", {
      email: newConversations[curConversationIndex].email,
      message: message
    });
    setConversations(newConversations);
    if(curConversationIndex != 0 && globalConversationIndex != 0 &&  newConversations[curConversationIndex].email != globalConversations[0].messages.sender) {
      setCurConversationIndex(0);
      globalConversationIndex = 0;
    }
  }
  const renderedApp = (
      <div className="App">
      <div className="messages-sidebar">
      <h1 className = "messages-title">Chats</h1>
        <ConversationList conversations={conversations} setCurConversationIndex={setCurConversationIndex} />
      </div>
      <div className="chat">
        {curConversationIndex !== null ? (
          <>
            <ChatHeader conversation={conversations[curConversationIndex]} />
            <MessageList className = "messageList" currentConversation={conversations[curConversationIndex]}/>
            <MessageForm handleSend={handleSend}/>
          </>
        ) : (
          <div className="no-conversation">No conversation selected</div>
        )}
      </div>
    </div>
  );
  firstRender();
  return renderedApp;
}
const rootNode = document.getElementById('messages-root');
const root = ReactDOM.createRoot(rootNode);
async function getConversations(signedIn) {
  let conversations = await makeRequest("/get-messages");
  conversations.map((x)=>x.people = x.people.filter((email) => email !== signedIn.email)[0]);
  for (let conversation of conversations) {
    Object.keys(profiles).includes(conversation.people) || (profiles[conversation.people] = await makeRequest("/fetch-profile" + "?email=" + conversation.people))
  }
  return conversations;
}

function formatConversations (conversations) {
  let formattedConversations = [];
  let i = 1;
  for (let conversation of conversations) {
    if (!Object.keys(profiles[conversation.people]).includes("name"))
      {continue;}
      for(let message of conversation.messages) {
        message.text = message.contents;
        delete message.contents;
      }
    let tempConversation = {
      id: i++,
      name: profiles[conversation.people].name,
      email: conversation.people,
      avatar: profiles[conversation.people].img,
      messages: conversation.messages
    }
    formattedConversations.push(tempConversation);
  }
  if(globalConversationIndex == null) {
    globalConversations = formattedConversations;
  return;
  }
  formattedConversations.sort((a, b) => b.messages[b.messages.length - 1].time - a.messages[a.messages.length - 1].time);
  let oldLength = formattedConversations[globalConversationIndex].messages.length;
  let newLength = globalConversations[globalConversationIndex].messages.length;
  difference = oldLength != newLength;
  globalConversations = formattedConversations;

}

async function fetchLoop() {
    formatConversations(await getConversations(signed));
    render(globalConversations);
    setTimeout(fetchLoop, 100);
}
async function main(signedIn) {
  signed = signedIn;
  
  if (!signedIn.isSignedIn) {
    getElem("not_signed_in").style.display = "block";
    return
  }
  getElem("loading").style.display = "block";

  let conversations = await getConversations(signed);
  getElem("loading").style.display = "none";
  if (conversations.length > 0) {
    formatConversations(conversations);
    root.render(React.createElement(App));
    fetchLoop();
  } else {
    
    getElem("noConversations").style.display = "block";
  }
}
signInQueue.push(main);