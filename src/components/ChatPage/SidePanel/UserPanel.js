import React, {useRef} from 'react'
import {IoIosChatboxes} from 'react-icons/io';
import Dropdown from 'react-bootstrap/Dropdown';
import Image from 'react-bootstrap/Image';
import {useSelector, useDispatch} from 'react-redux';
import {setPhotoURL} from '../../../redux/actions/user_action'
import {getDatabase, ref, update} from 'firebase/database';
import { getAuth, signOut, updateProfile } from 'firebase/auth';
import {getDownloadURL, getStorage, ref as strRef, uploadBytesResumable} from 'firebase/storage';


function UserPanel() {
    const user = useSelector(state => state.user.currentUser)
    const dispatch = useDispatch()
    const inputOpenImageRef = useRef();
    const handleOpenImageRef = () => {
        inputOpenImageRef.current.click();
    }

    const handleLogout = () => {
        const auth = getAuth();
        signOut(auth).then(()=>{

        }).catch((error)=>{

        });

    }
    const handleUploadImage = async(event) => {
        const file = event.target.files[0];
        const metadata = {contentType: file.type};
        const storage = getStorage();
        
        //스토리지에 파일 저장하기
        try{
            
            let uploadTask = uploadBytesResumable(strRef(storage, `user_image/${user.uid}`),file, metadata)

            uploadTask.on('state_changed',



                ()=>{
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL)=>{
                        updateProfile(user,{
                            photoURL:downloadURL 
                        })
                        dispatch(setPhotoURL(downloadURL))
                        update(ref(getDatabase(), `users/${user.uid}`), { image: downloadURL })
                    })
                }
                
            
            
            
            
            )
        }catch(error){
            console.log(error)
        }
    }
  return (
    <div>
        <h3 style={{color:'white'}}>
            <IoIosChatboxes/>{" "} Chat App

        </h3>

        <div style={{display:'flex', marginBottom:'1rem'}}>
            <Image style={{width:'30p', height:'30px', marginTop:'3px'}} src={user && user.photoURL} roundedCircle />
            <Dropdown>
                <Dropdown.Toggle style={{background: 'transparent', border:'0px'}} id="dropdown-basic">
                        {user && user.displayName}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    <Dropdown.Item onClick={handleOpenImageRef}>프로필 사진 변경</Dropdown.Item>
                    <Dropdown.Item onClick={handleLogout}>로그아웃</Dropdown.Item>
                    
                </Dropdown.Menu>
            </Dropdown>
        </div>
        <input
            onChange={handleUploadImage}
            accept="image/jpeg image/png"
            style={{display:'none'}}
            ref = {inputOpenImageRef}
            type="file"
        />
    </div>
  )
}

export default UserPanel