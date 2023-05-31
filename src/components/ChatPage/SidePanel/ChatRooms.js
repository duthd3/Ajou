import React, { Component } from 'react'
import { FaRegSmileWink} from 'react-icons/fa';
import {FaPlus} from 'react-icons/fa';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form'; 
import {connect} from 'react-redux';
import { getDatabase, ref, onChildAdded, onValue, push, child, update, off, DataSnapshot } from "firebase/database";
import { setCurrentChatRoom, setPrivateChatRoom} from '../../../redux/actions/chatRoom_action';
import Badge from 'react-bootstrap/Badge';

export class ChatRooms extends Component {

  state = {
    show:false,
    name:"",
    description:"",
    chatRoomsRef: ref(getDatabase(), "chatRooms"),
    messagesRef: ref(getDatabase(), "messages"),
    chatRooms: [],
    firstLoad: true,
    activeChatRoomId: "",
    notifications:[]

  }
  componentDidMount() {
    this.AddChatRoomsListeners();
  }

  componentWillUnmount() {
    off(this.state.chatRoomsRef);
    
  }

  setFirstChatRoom = () => {
    const firstChatRoom = this.state.chatRooms[0]
    if (this.state.firstLoad && this.state.chatRooms.length > 0){
      this.props.dispatch(setCurrentChatRoom(firstChatRoom))
      this.setState({ activeChatRoomId: firstChatRoom.id }) 
    }
    this.setState({ firstLoad: false })
  }

  AddChatRoomsListeners = () => {
    let chatRoomsArray = [];

    onChildAdded(this.state.chatRoomsRef, DataSnapshot => {
        chatRoomsArray.push(DataSnapshot.val());
        this.setState({ chatRooms: chatRoomsArray },() => this.setFirstChatRoom());
        this.addNotificationListener(DataSnapshot.key);
    })

  }
  addNotificationListener = (chatRoomId) => {
    let { messagesRef } = this.state;
    onValue(child(messagesRef, chatRoomId), DataSnapshot =>{
      if (this.props.chatRoom){
        this.handleNotification(
          chatRoomId,
          this.props.chatRoom.id,
          this.state.notifications,
          DataSnapshot
        )

      }
    })
  }
  handleNotification = (chatRoomId, currentChatRoomId, notifications, DataSnapshot) => {
    let lastTotal = 0

    let index = notifications.findIndex(notification =>
      notification.id === chatRoomId)
     
    if (index === -1){
      notifications.push({
        id:chatRoomId,
        total:DataSnapshot.size,
        lastKnownTotal:DataSnapshot.size,
        count:0
      })
    }else{
      if(chatRoomId !== currentChatRoomId){
        lastTotal = notifications[index].lastKnownTotal //현재까지 유저가 확인한 총 메시지 개수

        //count(알림으로 보여줄 숫자)를 구하기
        //현재 총 메시지 개수 - 이전에 확인한 총 메시지 개수 > 0
        if(DataSnapshot.size - lastTotal > 0){
          notifications[index].count = DataSnapshot.size - lastTotal
        }
      }
      //total property에 현재 전체 메시지 개수를 넣어주기
      notifications[index].total = DataSnapshot.size

    }
    this.setState({notifications})
  }

  handleClose = () => this.setState({show:false});
  handleShow = () => this.setState({show:true});
  handleSubmit = (e) => {
    e.preventDefault();
    const {name, description} = this.state;
    
    if(this.isFormValid(name, description)){
      this.addChatRoom();
    }

    
  }

  addChatRoom = async() => {
    const key = push(this.state.chatRoomsRef).key;
    const {name, description} = this.state;
    const {user} = this.props;
    const newChatRoom = {
      id: key,
      name: name,
      description: description,
      createdBy: {
        name:user.displayName,
        image:user.photoURL
      }
    }
    try {
      await update(child(this.state.chatRoomsRef, key), newChatRoom)
      this.setState({
          name: "",
          description: "",
          show: false
      })
    }catch (error) {
      alert(error)
    }
  }


  isFormValid = (name, description) => name && description

  changeChatRoom = (room) => {
    this.props.dispatch(setCurrentChatRoom(room));
    this.props.dispatch(setPrivateChatRoom(false));
     
    this.setState({ activeChatRoomId: room.id })
    this.clearNotifications();
}

  clearNotifications = () => {
    let index = this.state.notifications.findIndex(
      notification => notification.id === this.props.chatRoom.id
    )
    if(index !== -1){
      let updatedNotifications = [...this.state.notifications]
      updatedNotifications[index].lastKnownTotal = this.state.notifications[index].total;
      updatedNotifications[index].count = 0
      this.setState({notifications: updatedNotifications})
    }
  }

  getNotificationCount = (room) => {
    //해당 채팅방의 count수를 구하는 중입니다.
    let count = 0;

    this.state.notifications.forEach(notification => {
        if(notification.id === room.id){
          count = notification.count;
        }
    })
    if(count > 0 ) return count;
  }

  renderChatRooms = (chatRooms) =>
        chatRooms.length > 0 &&
        chatRooms.map(room => (
            <li
                key={room.id}
                style={{
                    backgroundColor: room.id === this.state.activeChatRoomId &&
                        "#ffffff45"
                }}
                onClick={() => this.changeChatRoom(room)}
            >
                # {room.name}
                <Badge style={{ float: 'right'}} variant="danger">
                    {this.getNotificationCount(room)}
                </Badge>
                
            </li>
        ))
  







  render() {
    return (
      <div>
        <div style={{
          position:'relative', width:'100%',
          display:'flex', alignItems:'center'
        }}>
        <FaRegSmileWink style={{marginRight:3}}/>
        CHAT ROOMS (1)
        <FaPlus 
          onClick={this.handleShow}
          style={{
          position:'absolute',
          right:0, cursor:'pointer'}}/>
        

        </div>
       
        <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {this.renderChatRooms(this.state.chatRooms)}
        </ul>


        
        

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Create a chat room</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={this.handleSubmit}>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>방 이름</Form.Label>
                <Form.Control onChange={(e) => this.setState({ name: e.target.value })} type="text" placeholder="Enter a chat room name" />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>방 설명</Form.Label>
                <Form.Control  onChange={(e) => this.setState({ description: e.target.value })} type="text" placeholder="Enter a chat room description" />
              </Form.Group>
              
            </Form>
          </Modal.Body>
          <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={this.handleSubmit}>
            Create
          </Button>
          </Modal.Footer>
        </Modal> 
      </div>
    )
  }
}

const mapStateToProps = state => {
  return {
      user: state.user.currentUser,
      chatRoom: state.chatRoom.currentChatRoom
      
  }
}

export default connect(mapStateToProps)(ChatRooms)