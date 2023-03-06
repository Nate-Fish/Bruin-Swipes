// import React, { React.useState } from 'react';

function MessageForm(props) {
  const [message, setMessage] = React.useState("");
  const { handleSend } = props;

  const handleChange = (event) => {
    setMessage(event.target.value);
  };

  const handleClick = (event) => {
    handleSend(message);
    setMessage('');
  }
    

  // const handleSend = () => {
  //   if (message !== '') {
  //     // Send the code to the database
  //     console.log(message);   
  //     // Clear the textbox
  //     setMessage('');
  //   }
  // };

  return (
    <div>
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
      className = "button">Send</button>
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
    // <div>Helo</div>
  );
}
function ChatHeader(props) {
  const { conversation } = props;

  return (
    <div>

      <h2><img src={conversation.avatar} alt="conversation avatar" className = "imageHeader"/> {conversation.name} </h2>
    </div>
  );
}
function ConversationList(props) {
  console.log("Setting current conversations")
  const { conversations, setCurConversationIndex } = props;

  const handleClick = (index) => {
    console.log(index)
    // setMessages([...messages, {id: messages.length, sender: message.sender, text: message.text, time: currentDate.getDate()}]);
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
            <p className="message">{conversation.messages[0].text.substring(0, 50)}...</p>
            <div className = "preview-time"> <p>{conversation.messages[0].time}</p> 
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
          text: "gimme gimme? lets make the message a little longer and even longer lets see how long i can make it before it decides to cut it off",
          time: "10:20 AM",
        },
        {
          received: false,
          text: "no i dont :)",
          time: "10:32 AM",
        }
      ]
    }
  ]);
  const [curConversationIndex, setCurConversationIndex] = React.useState(null);
  // const [messages, setMessages] = React.useState([]);
  
  const handleSend = (message) => {
    // update the conversations array with the new message.
    // only update the current conversation index

    const newConversations = [...conversations];
    newConversations[curConversationIndex].messages.push({
      received: false,
      text: message,
      time: "10:32 AM",
    });
    setConversations(newConversations);
  }
  // const conversations = 

  // const setCCM = (conversation, message)

  return (
    <div className="App">
      <div className="sidebar">
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
root.render(React.createElement(App));
// export default App;