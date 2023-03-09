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
  return (
    <div>
      {currentConversation.messages.map(message => (
        <div key={message.id}>
          <p>{message.sender == signed.email ? "You" : profiles[message.sender].name}: {message.text}</p>
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
/**
 * Dictionary mapping emails to profile objects.
 */
let profiles = {};
let globalConversations = [];
let signed;
let render;
let globalConversationIndex = null;

// let globalConversations = [
//   {
//     id: 1,
//     name: "Bruin Bear",
//     avatar: "https://art.pixilart.com/0ae85e84a5bdae3.png",
//     messages: [
//       {
//         sender: "true",
//         contents: "Hey there cutie! Would you like to buy a swipe?",
//         time: "10:30 AM",
//       },
//       {
//         sender: "",
//         text: "Yes i want free swipes!",
//         time: "10:31 AM",
//       }
//     ]
//   },
//   {
//     id: 2,
//     name: "Paul Eggy",
//     avatar: "https://www.researchgate.net/profile/Alfonso-Padilla-Vivanco/publication/280672565/figure/fig4/AS:284547204829193@1444852748854/A-binary-input-image-size-40X40-px.png",
//     messages: [
//       {
//         sender: "true",
//         text: "gimme free swipes",
//         time: "10:20 AM",
//       },
//       {
//         sender: "false",
//         text: "no i dont :)",
//         time: "10:32 AM",
//       }
//     ]
//   },
//   {
//       id: 3,
//       name: "Swag",
//       avatar: "https://pbs.twimg.com/media/D2Y5afjWsAYqL7u?format=png&name=360x360",
//       messages: [
//         {
//           received: true,
//           text: "I am interested in buying swipes",
//           time: "10:50 AM",
//         },
//       ]
//     }
// ];

function App() {
  // use Retrieve messages to populate conversations with the messages related to the current user seperated by conversation
  // use the current user's email to get the messages related to the current user
  // the other email in people array is the email of the other person in the conversation and should be used to get the name and avatar of the other person
  // the conversations should check the time of the most recent message and sort conversations by most recent message in descending order
  // the messages should be sorted by time in ascending order


  // const [conversations, setConversations] = React.useState([
  //   {
  //     name: name,
  //     avatar: ,
  //     messages: [
  //       {
  //         contents: response[0].messages
  //       }
  //     ]
  //   }
  // ]);
  const [conversations, setConversations] = React.useState(globalConversations);
  const [curConversationIndex, setCurConversationIndex] = React.useState(null);
  globalConversationIndex = curConversationIndex;
  render = setConversations;
  const handleSend = async (message) => {
    //get the time in AM/PM format
    const date = new Date();
    const showTime = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    const epochTime = Date.now();
    const newConversations = [...conversations];
    await makeRequest("/send-messages", {
      email: newConversations[curConversationIndex].email,
      message: message
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
  console.log(conversations);
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
    console.log(tempConversation);
    formattedConversations.push(tempConversation);
  }
  if(globalConversationIndex == null) {
    globalConversations = formattedConversations;
  return;
  }
  let oldLength = formattedConversations[globalConversationIndex].messages.length;
  let newLength = globalConversations[globalConversationIndex].messages.length;
  globalConversations = formattedConversations;
  if (globalConversationIndex !== null && newLength !== oldLength) {
    setTimeout(() => document.getElementsByClassName("chat")[0].scrollTo(99999,99999), 250) 
  }
}
async function fetchLoop() {
    formatConversations(await getConversations(signed));
    render(globalConversations);
    setTimeout(fetchLoop, 250);
}
async function main(signedIn) {
  signed = signedIn;;
  formatConversations(await getConversations(signed));
  root.render(React.createElement(App));
  fetchLoop();
}
signInQueue.push(main);
