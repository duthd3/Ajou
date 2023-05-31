import ChatPage from './components/ChatPage/ChatPage';
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import {Routes, Route, BrowserRouter as Router, useNavigate} from "react-router-dom"
import React, {useEffect} from "react";
import { useDispatch, useSelector } from 'react-redux';
import './App.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  setUser,
  clearUser
} from './redux/actions/user_action';


function App(props) {
  const navigate = useNavigate();
  let dispatch = useDispatch();
  const isLoading = useSelector((state)=>state.user.isLoading);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user)=>{
      if(user){ //로그인이 된 상태
        navigate("/");
        dispatch(setUser(user))
      }else{//로그인이 안 된 상태
        navigate("/login")
        dispatch(clearUser())
        
      }
    })
 }, []);
  if(isLoading){
    return <div>...loading</div>
  }else{
    return (
    
      <Routes>
        <Route exact path="/" element={<ChatPage/>}/>
        <Route exact path="/login" element={<LoginPage/>}/>
        <Route exact path="/register" element={<RegisterPage/>}/>
      </Routes>
    
    );
  }
  
}

export default App;
