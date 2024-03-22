import { db } from "./firebase.js"
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js"
import { collection, updateDoc, getDocs, deleteDoc, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js"

const auth = getAuth()
onAuthStateChanged(auth, (user) => {
  if (user) {
    getQuestion()
  } else {
    location.href = "login.html"
  }
});

document.querySelector('#hideButton').addEventListener('click', removeReader)

async function getQuestion() {
  const endDiv = document.querySelector('#endDiv')
  const q = query(collection(db, "questions"), orderBy("timestamp", 'desc'))
  const querySnapshot = await getDocs(q);
  let index = 1
  querySnapshot.forEach((doc) => {
    const newDiv = document.createElement('div')

    const number = document.createElement('p')
    const content = document.createElement('p')
    const inputOpened = document.createElement('input')
    const inputReaded = document.createElement('input')
    const inputId = document.createElement('input')
    const button = document.createElement('button')

    newDiv.classList.add("title-container-index")
    newDiv.setAttribute("id", "divID" + index)

    const hours = new Date(doc.data().timestamp.toDate()).toLocaleTimeString().split(":")
    const time = hours[0] + ":" + hours[1]
    number.innerHTML = time
    number.setAttribute("id", "number")

    content.setAttribute("class", "content")
    content.innerHTML = doc.data().content

    inputOpened.setAttribute("id", "isOpened")
    inputOpened.setAttribute("type", "hidden")
    inputOpened.setAttribute("value", "false")

    inputReaded.setAttribute("id", "isReaded")
    inputReaded.setAttribute("type", "hidden")
    inputReaded.setAttribute("value", doc.data().read)

    if (doc.data().read) {
      newDiv.style["background-color"] = "#67dc73"
    }

    inputId.setAttribute("id", "inputId")
    inputId.setAttribute("type", "hidden")
    inputId.setAttribute("value", doc.id)


    button.setAttribute("id", "remove-button")
    button.setAttribute("id", "remove-button")
    button.setAttribute("id", "remove-button")
    button.innerHTML = "X"

    newDiv.appendChild(number)
    newDiv.appendChild(content)
    newDiv.appendChild(inputOpened)
    newDiv.appendChild(inputReaded)
    newDiv.appendChild(inputId)
    newDiv.appendChild(button)

    document.body.insertBefore(newDiv, endDiv)

    newDiv.addEventListener('click', async (event) => {
      const div = event.currentTarget;
      const removeButton = div.querySelector('#remove-button')
      const readButton = div.querySelector('.readButton')
      const isOpened = div.querySelector('#isOpened')
      const content = div.querySelector('.content')

      if (removeButton === event.target) {
        removeElement(div)
      }
      else if (readButton == event.target) {
      }
      else if (content === event.target) {

      }
      else {
        if (isOpened.value === 'false') {
          openQuestion(div)
          isOpened.value = 'true'
        } else {
          closeQuestion(div)
          isOpened.value = 'false'
        }
      }
    })

    index++
  });
}

async function removeElement(div) {
  const bestDiv = document.querySelector("#" + div.id)
  bestDiv.style["display"] = "none"
  await deleteDoc(doc(db, "questions", div.querySelector("#inputId").value));
}

function openQuestion(div) {
  const divNumber = div.querySelector('#number')
  const removeButton = div.querySelector('#remove-button')
  const content = div.querySelector('.content')
  divNumber.setAttribute("hidden", "")
  removeButton.setAttribute("hidden", "")
  content.classList.add("contentOpened")
  div.classList.add("titleOpened")

  const readButton = document.createElement("button")
  readButton.setAttribute("class", "readButton")
  readButton.innerHTML = "Segna come già letto"
  readButton.addEventListener('click', async (event) => {
    const div = event.currentTarget.parentElement
    let isReaded = div.querySelector("#isReaded").value
    if (isReaded === 'true') {
      div.style["background-color"] = "#0CA7FF"
      div.querySelector("#isReaded").value = "false"
      isReaded = false
    }
    else {
      if (document.querySelector('#hideButton').value === "on") {
        div.style["display"] = "none"
      }
      div.style["background-color"] = "#67dc73"
      div.querySelector("#isReaded").value = "true"
      isReaded = true
    }

    const docRef = doc(db, "questions", div.querySelector('#inputId').value);
    await updateDoc(docRef, {
      read: isReaded
    });
  })
  div.appendChild(readButton)
}

function closeQuestion(div) {
  const divNumber = div.querySelector('#number')
  const removeButton = div.querySelector('#remove-button')
  const readButton = div.querySelector('.readButton')
  const content = div.querySelector('.content')
  divNumber.removeAttribute("hidden", "")
  removeButton.removeAttribute("hidden", "")
  content.classList.remove("contentOpened")
  readButton.remove()
  div.classList.remove("titleOpened")
}


function removeReader() {
  let hideButton = document.querySelector('#hideButton')
  if (hideButton.value === "off") {
    const divs = document.querySelectorAll('div')
    divs.forEach((div) => {
      if (div.querySelector("#isReaded")?.value === 'true') {
        div.style["display"] = "none"
      }
    })
    hideButton.style["background-color"] = "#affca7"
    hideButton.innerHTML = "Show"
    hideButton.value = "on"
  }
  else {
    const divs = document.querySelectorAll('div')
    divs.forEach((div) => {
      if (div.querySelector("#isReaded")?.value === 'true') {
        div.style.removeProperty('display')
      }
    })
    hideButton.innerHTML = "Hide"
    hideButton.style["background-color"] = "rgb(255, 100, 100)"
    hideButton.value = "off"
  }
}