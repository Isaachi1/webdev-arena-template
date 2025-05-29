import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    projectId: "testellm-767e1",
    measurementId: "G-YQ9EXQ1BL6",
    messagingSenderId: "728894976597",
    authDomain: "testellm-767e1.firebaseapp.com",
    apiKey: "AIzaSyD9ihRlftVT5zFkWffl2nj7AzA6UaIeJbk",
    appId: "1:728894976597:web:53d51f0a88a87c2a399adc",
    storageBucket: "testellm-767e1.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);