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
        const currentSender = message.sender === currentUser ? "You" : profiles[message.sender].name;
        const showSender = message.sender !== prevSender;
        prevSender = message.sender;
        return (
          <div key={message.id} className={message.sender === currentUser ? "message-right" : "message-left"}>
            {showSender && <div className="message-sender">{currentSender}</div>}
            <div className={`message-text ${message.sender === currentUser ? "message-right-text" : "message-left-text"}`}>{message.text}</div>
          </div>
        );
      })}
    </div>
  );
}

function ChatHeader(props) {
  const { conversation } = props;
  // TODO add link to profile page using email
  return (
    <div className = "image-header">
      <h2><img src={conversation.avatar} alt="conversation avatar" style={{"maxWidth" : "50px"}}/> 
      <a className="profile-link" href="{'profile.html' + conversation.email}">{'\t' + conversation.name}</a> 
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

function App() {
  const [conversations, setConversations] = React.useState(globalConversations);
  const [curConversationIndex, setCurConversationIndex] = React.useState(null);
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
  return (
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
  globalConversations = formattedConversations;
  if (globalConversationIndex !== null && newLength !== oldLength) {
    setTimeout(() => document.getElementsByClassName("chat")[0].scrollTo(99999,99999), 200) 
  }
}

async function fetchLoop() {
    formatConversations(await getConversations(signed));
    render(globalConversations);
    setTimeout(fetchLoop, 200);
}
async function main(signedIn) {
  signed = signedIn;
  formatConversations(await getConversations(signed));
  root.render(React.createElement(App));
  fetchLoop();
}
signInQueue.push(main);