import React, { useState } from 'react';

function TextBox() {
  const [code, setCode] = useState('');

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && code !== '') {
      console.log(code);
      setCode('');
    }
  }

  const handleButtonPress = () => {
    if (code !== '') {
      console.log(code);
      // Send message
      // sendMessage();
      setCode("");
      document.getElementById("textbox").focus();
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Type a message"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button onClick={handleButtonPress}>Send</button>
    </div>
  );
}
function Sidebar(props) {
  const { conversations } = props;
  const { selected, setSelected } = useState(-1);
  return (
    <div className="sidebar">
      {conversations.map((conversation) => (
        <div className="conversation" key={conversation.id}>
          <img src={conversation.avatar} alt={conversation.name} className="avatar" />
          <div className="details">
            <span className="name">{conversation.name}</span>
            <span className="message">{conversation.message}</span>
            <span className="time">{conversation.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
function App() {
  const conversations = [
    {
      senderID: 1,
      recipientID: 202,
      listingID: 103,
      name: "Bruin Bear",
      avatar: "https://commons.wikimedia.org/wiki/File:TZDB_and_some_challenges_of_long_data_-_Paul_Eggert_-_LibrePlanet_2022.png",
      message: "Hey there cutie!",
      time: "10:30 AM",
    },
    {
      id: 2,
      recipientID: 204,
      listingID: 102,
      name: "I forgot bear name",
      avatar: "https://www.researchgate.net/profile/Alfonso-Padilla-Vivanco/publication/280672565/figure/fig4/AS:284547204829193@1444852748854/A-binary-input-image-size-40X40-px.png",
      message: "gimme gimme?",
      time: "11:45 AM",
    },
    {
      id: 3,
      recipientID: 403,
      listingID: 101,
      name: "ruhorh",
      avatar: "https://via.placeholder.com/40",
      message: "hola?",
      time: "12:15 PM",
    },
    {
      id: 31,
      recipientID: 93,
      listingID: 121,
      name: "Navraj Goraya",
      avatar: "https://via.placeholder.com/40",
      message: "Hey, do you know the first brown boy to get it poppin? ",
      time: "12:55 PM",
    },
    {
      id: 32,
      recipientID: 40,
      listingID: 131,
      name: "Drake",
      avatar: "https://via.placeholder.com/40",
      message: "",
      time: "8:15 PM",
    },
  ];

  return (
    <div>
      <h1>Chats</h1>
      <h3>Search Bar</h3>
      <Sidebar conversations={conversations} />
      <div className = "textbox">
         <TextBox> </TextBox>
         </div>
    </div>

  );
}

export default App;
