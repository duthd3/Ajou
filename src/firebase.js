import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import "firebase/auth";
import "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyAZnMRBflvEE5F6ZutQS9ym_WVetVZZtFc",
    authDomain: "react-firebase-chat-app-59a14.firebaseapp.com",
    projectId: "react-firebase-chat-app-59a14",
    storageBucket: "react-firebase-chat-app-59a14.appspot.com",
    messagingSenderId: "184194278213",
    appId: "1:184194278213:web:c3032d55f2554bf8f9942c",
    measurementId: "G-MX4SPYLNSW"
  };


const app = initializeApp(firebaseConfig);

export default app;