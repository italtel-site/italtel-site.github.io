import {} from "./firebase.js"
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js"

const auth = getAuth()
onAuthStateChanged(auth, (user) => {
  if (user) {
    location.href = "list.html"
  }
});


document.getElementById("form-login").addEventListener("submit", function (e) {
  e.preventDefault()

  let formData = new FormData(e.target)
  let formObj = Object.fromEntries(formData)
  const auth = getAuth()
  signInWithEmailAndPassword(auth, formObj.email, formObj.password)
    .then(() => {
      location.href = "list.html"
    })
    .catch((error) => {
      document.querySelector('#error-login').removeAttribute("hidden","")
      document.querySelector('#username_login').style["border-color"] = "red"
      document.querySelector('#password_login').style["border-color"] = "red"
      const errorMessage = error.message;
      console.log(errorMessage)
    });
});
