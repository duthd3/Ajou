import React, { useState, useRef } from 'react'
import Form from 'react-bootstrap/Form';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import firebase from '../../../firebase';
import { useSelector } from 'react-redux';

import { getDatabase, ref, set, remove, push, child } from "firebase/database";
import { getStorage, ref as strRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";


function MessageForm() {
  const chatRoom = useSelector(state => state.chatRoom.currentChatRoom)
  const user = useSelector(state => state.user.currentUser)
  const [content, setContent] = useState("")
  const [percentage, setPercentage] = useState(0)
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const messagesRef = ref(getDatabase(), "messages")
  const inputOpenImageRef = useRef();
  const isPrivateChatRoom = useSelector(state => state.chatRoom.isPrivateChatRoom)
  const typingRef = ref(getDatabase(), "typing")
  const handleSubmit = async() => {
    if (!content) {
      setErrors(prev => prev.concat("Type contents first"))
      return;
    }
    setLoading(true);
    //firebase에 메시지를 저장하는 부분
    try{
      await set(push(child(messagesRef, chatRoom.id)), createMessage())

      await remove(child(typingRef, `${chatRoom.id}/${user.uid}`));
      setLoading(false)
      setContent("")
      setErrors([])
    }catch(error){
      setErrors(pre => pre.concat(error.message))
      setLoading(false)
      setTimeout(() => {
        setErrors([])
    }, 5000); 
      
    }
  }

  const createMessage = (fileUrl = null) => {
    const message = {
      timestamp: new Date(),
      user: {
          id: user.uid,
          name: user.displayName,
          image: user.photoURL
      }
    }
    if(fileUrl != null){
      message["image"] = fileUrl;
    }else {
      message["content"] = content;
    }
    return message; 
  }

  const handleChange = (event) => {
    setContent(event.target.value)
  }
  
  const handleOpenImageRef = () => {
    inputOpenImageRef.current.click()
  }
  const getPath = () => {
    if(isPrivateChatRoom){
      return `/message/private/${chatRoom.id}`
    }else{
      return `/message/public`
    }
  }

  const handleUploadImage = (event) => {
    const file = event.target.files[0];
    const storage = getStorage();
    const filePath = `${getPath()}/${file.name}`;
    const metadata = { contentType: file.type }
    setLoading(true)
    try{
      const storageRef = strRef(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      uploadTask.on('state_changed', 
        (snapshot)=> {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
          switch (snapshot.state) {
            case 'paused':
                console.log('Upload is paused');
                break;
            case 'running':
                console.log('Upload is running');
                break;
        }

        },
        (error)=>{

        },
        () => {
          //저장이 다 된 후에 파일 메시지 전송(데이터베이스에 저장된)
          //저장된 파일을 다운로드 받을 수 있는 URL 가져오기 
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            console.log('File available at', downloadURL);
            set(push(child(messagesRef, chatRoom.id)), createMessage(downloadURL))
            setLoading(false)
        });
        }
        
      );
    }catch(error){
      alert(error)
    }
    
  }

  const handleKeyDown = (event) => {

    if (event.ctrlKey && event.keyCode === 13) {
        handleSubmit();
    }

    const userUid = user.uid;
    if (content) {
        set(ref(getDatabase(), `typing/${chatRoom.id}/${user.uid}`), {
            userUid: user.displayName
        })
    } else {
        remove(ref(getDatabase(), `typing/${chatRoom.id}/${user.uid}`))
    }
}



  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="exampleForm.ControlTextarea1">
          <Form.Control
            onKeyDown={handleKeyDown} 
            value = {content}
            onChange={handleChange}           
            as="textarea"
            rows={3} />
        </Form.Group>
        </Form>
        {
          !(percentage === 0 || percentage === 100) &&
                <ProgressBar variant="warning" label={`${percentage}%`} now={percentage} />
        }
        <div>
                {errors.map(errorMsg => <p style={{ color: 'red' }} key={errorMsg}>
                    {errorMsg}
                </p>)}
        </div>
        <Row>
          <Col>
            <button
              onClick={handleSubmit} 
              className='message-form-button'
              style={{ width: '100%' }}
              disabled={loading ? true : false}>
                SEND
            </button>
          </Col>
          <Col>
            <button
              onClick={handleOpenImageRef} 
              className='message-form-button'
              style={{ width: '100%' }}
              disabled={loading ? true : false}>
              UPLOAD
            </button>
          </Col>
        </Row>
        <input
                accept="image/jpeg, image/png"
                style={{ display: 'none' }}
                type="file"
                ref={inputOpenImageRef}
                onChange={handleUploadImage}
            />
    </div>
  )
}

export default MessageForm